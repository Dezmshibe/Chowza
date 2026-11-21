
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Unplug,
} from "lucide-react";

import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    FB?: {
      init: (options: Record<string, unknown>) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
            userID?: string;
            expiresIn?: number;
          };
          status?: string;
        }) => void,
        options: Record<string, unknown>,
      ) => void;
    };

    fbAsyncInit?: () => void;
  }
}

type ConnectionRow = {
  connection_status: string;
  display_phone_number: string | null;
  verified_name: string | null;
  connected_at: string | null;
  is_enabled: boolean;
};

type SignupData = {
  code?: string;
  wabaId?: string;
  phoneNumberId?: string;
  submitted?: boolean;
};

type Props = {
  businessId?: string;
  businessName: string;
};

const META_APP_ID = import.meta.env.VITE_META_APP_ID as
  | string
  | undefined;

const META_CONFIG_ID = import.meta.env
  .VITE_META_EMBEDDED_SIGNUP_CONFIG_ID as string | undefined;

const META_GRAPH_API_VERSION =
  (import.meta.env.VITE_META_GRAPH_API_VERSION as string) || "v25.0";

export const WhatsAppConnectionCard: React.FC<Props> = ({
  businessId,
  businessName,
}) => {
  const [connection, setConnection] =
    useState<ConnectionRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const signupRef = useRef<SignupData>({});

  // Prevent duplicate login attempts.
  const loginStartedRef = useRef(false);

  // Identifies an active signup attempt.
  const signupLaunchRef = useRef(false);

  // Prevents multiple completion requests.
  const completionPromiseRef = useRef<Promise<void> | null>(null);

  const loadConnection = useCallback(async () => {
    if (!businessId) {
      setConnection(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: queryError } = await supabase
      .from("business_whatsapp_connections")
      .select(
        "connection_status, display_phone_number, verified_name, connected_at, is_enabled",
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (queryError) {
      console.error(
        "[Chowza WhatsApp] Connection status error:",
        queryError.message,
      );

      setError("Unable to load WhatsApp connection status.");
    } else {
      setConnection(data as ConnectionRow | null);
    }

    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  const completeSignupIfReady = useCallback(async () => {
    const signup = signupRef.current;

    if (
      signup.submitted ||
      !signup.code ||
      !signup.wabaId ||
      !signup.phoneNumberId ||
      !businessId
    ) {
      return;
    }

    // Prevent two callbacks from submitting the same signup.
    if (completionPromiseRef.current) {
      return completionPromiseRef.current;
    }

    signup.submitted = true;

    setNotice("Finishing your secure WhatsApp connection…");

    const completion = (async () => {
      try {
        console.log("[Chowza WhatsApp] Submitting connection:", {
          hasAuthorizationCode: Boolean(signup.code),
          hasWabaId: Boolean(signup.wabaId),
          hasPhoneNumberId: Boolean(signup.phoneNumberId),
        });

        const { data, error: invokeError } =
          await supabase.functions.invoke("whatsapp-connect", {
            body: {
              action: "exchange_code",
              businessId,
              code: signup.code,
              wabaId: signup.wabaId,
              phoneNumberId: signup.phoneNumberId,
            },
          });

        if (invokeError || data?.error) {
          console.error(
            "[Chowza WhatsApp] Connection request failed:",
            data?.error || invokeError?.message,
          );

          throw new Error(
            data?.error ||
              invokeError?.message ||
              "Could not complete WhatsApp connection.",
          );
        }

        signupLaunchRef.current = false;
        loginStartedRef.current = false;
        signupRef.current = {};

        setConnecting(false);
        setError("");
        setNotice("WhatsApp is connected successfully.");

        await loadConnection();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not complete WhatsApp connection.";

        signupLaunchRef.current = false;
        loginStartedRef.current = false;
        signupRef.current = {};

        setConnecting(false);
        setError(message);
        setNotice("");
      } finally {
        completionPromiseRef.current = null;
      }
    })();

    completionPromiseRef.current = completion;

    return completion;
  }, [businessId, loadConnection]);

  useEffect(() => {
    if (
      !META_APP_ID ||
      !META_CONFIG_ID ||
      !connecting ||
      !signupLaunchRef.current
    ) {
      return;
    }

    let active = true;
    let timeoutId: number | undefined;

    // Register the message listener before opening Meta Login.
    const onMessage = (event: MessageEvent) => {
      console.log("[Chowza Meta] RAW MESSAGE RECEIVED:", {
  origin: event.origin,
  dataType: typeof event.data,
  isString: typeof event.data === "string",
  messageLength:
    typeof event.data === "string"
      ? event.data.length
      : undefined,
  dataKeys:
    event.data && typeof event.data === "object"
      ? Object.keys(event.data)
      : [],
  signupActive: signupLaunchRef.current,
});
      if (!active || !signupLaunchRef.current) {
        return;
      }

      let hostname = "";

      try {
        hostname = new URL(event.origin).hostname;
      } catch {
        return;
      }

      if (
        hostname !== "facebook.com" &&
        !hostname.endsWith(".facebook.com")
      ) {
        return;
      }

      if (typeof event.data !== "string") {
        return;
      }

      
      // Facebook can send internal SDK messages that are not JSON.
      // Ignore those instead of treating them as signup failures.
     const rawMessage = event.data.trim();

const firstBrace = rawMessage.indexOf("{");
const lastBrace = rawMessage.lastIndexOf("}");
console.log("[Chowza Meta] Safe message diagnostics:", {
  origin: event.origin,
  dataType: typeof event.data,
  messageLength: rawMessage.length,
  hasJsonObject: firstBrace >= 0 && lastBrace > firstBrace,
  containsSignupEvent: rawMessage.includes("WA_EMBEDDED_SIGNUP"),
  containsFinishEvent: rawMessage.includes("FINISH"),
  containsCancelEvent: rawMessage.includes("CANCEL"),
  containsErrorEvent: rawMessage.includes("ERROR"),
});

if (firstBrace < 0 || lastBrace <= firstBrace) {
  console.warn("[Chowza Meta] No JSON payload found in message.");
  return;
}

let payload: any;

try {
  payload = JSON.parse(
    rawMessage.slice(firstBrace, lastBrace + 1)
  );
} catch (err){
  console.error("[Chowza Meta] Embedded JSON parsing failed:", {
    error: err instanceof Error ? err.message : "Unknown error",
  });
  return;
}

console.log("[Chowza Meta] Parsed message:", {
  type: payload?.type,
  event: payload?.event,
  dataKeys: Object.keys(payload?.data || {}),
});

      console.log("[Chowza Meta] Parsed message:", {
        keys: Object.keys(payload || {}),
        type: payload?.type,
        event: payload?.event,
        dataKeys: Object.keys(payload?.data || {}),
      });

      if (payload?.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      if (payload.event === "FINISH") {
        signupRef.current.wabaId = String(
          payload.data?.waba_id || ""
        );

        signupRef.current.phoneNumberId = String(
          payload.data?.phone_number_id || ""
        );

        console.log("[Chowza Meta] Signup finished:", {
          hasWabaId: Boolean(signupRef.current.wabaId),
          hasPhoneNumberId: Boolean(
            signupRef.current.phoneNumberId
          ),
        });

        void completeSignupIfReady();
      } else if (payload.event === "CANCEL") {
        signupLaunchRef.current = false;
        loginStartedRef.current = false;
        setConnecting(false);
        setNotice("WhatsApp setup was cancelled.");
            } else if (payload.event === "ERROR") {
        signupLaunchRef.current = false;
        loginStartedRef.current = false;
        setConnecting(false);
        setError("Meta reported an error during WhatsApp setup.");
      }
    };
    // Register Meta's Embedded Signup event listener
    // BEFORE opening the Facebook Login dialog.
    window.addEventListener("message", onMessage);

    console.log("[Chowza Meta] Message listener registered.");
    const initializeSdk = () => {
      if (!window.FB || loginStartedRef.current) {
        return;
      }

      loginStartedRef.current = true;

      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: false,
        version: META_GRAPH_API_VERSION,
      });

      console.log("[Chowza Meta] Opening Embedded Signup.");

      window.FB.login(
        (response) => {
          const code = response.authResponse?.code;

          console.log("[Chowza Meta] Login result:", {
            status: response.status,
            hasAuthorizationCode: Boolean(code),
          });

          if (code) {
            signupRef.current.code = code;

            void completeSignupIfReady();
          } else {
            // Meta can send intermediate callbacks without a code.
            // Keep the signup listener active while waiting for FINISH.
            if (active && signupLaunchRef.current) {
              setNotice(
                "Waiting for WhatsApp signup to finish in Meta…",
              );
            }
          }
        },
        {
          config_id: META_CONFIG_ID,
          auth_type: "rerequest",
          response_type: "code",
          override_default_response_type: true,
         extras: {
  setup: {},
  sessionInfoVersion: "3",
},
        },
      );
    };

    // The SDK calls fbAsyncInit after it has loaded.
    window.fbAsyncInit = initializeSdk;

    if (window.FB) {
      initializeSdk();
    } else {
      let script = document.getElementById(
        "facebook-jssdk",
      ) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");

        script.id = "facebook-jssdk";
        script.src =
          "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";

        document.head.appendChild(script);
      }
    }

    // Prevent an indefinite Connecting state.
    timeoutId = window.setTimeout(() => {
      if (!active || !signupLaunchRef.current) {
        return;
      }

      signupLaunchRef.current = false;
      loginStartedRef.current = false;

      setConnecting(false);
      setError(
        "WhatsApp signup timed out. Meta did not complete the connection. Please try again.",
      );
      setNotice("");
    }, 120000);

    return () => {
      active = false;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("message", onMessage);
    };
  }, [connecting, completeSignupIfReady]);

  const connect = () => {
    setError("");
    setNotice("");

    if (!businessId) {
      setError(
        "This business is missing its Supabase business ID. Contact support.",
      );
      return;
    }

    if (!META_APP_ID || !META_CONFIG_ID) {
      setError(
        "Meta Embedded Signup is not configured in the website environment.",
      );
      return;
    }

    signupRef.current = {};
    completionPromiseRef.current = null;

    signupLaunchRef.current = true;
    loginStartedRef.current = false;

    setConnecting(true);
  };

  const disconnect = async () => {
    if (
      !businessId ||
      !window.confirm(
        "Disconnect WhatsApp for this business?",
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    signupLaunchRef.current = false;
    loginStartedRef.current = false;

    setConnecting(true);

    try {
      const { data, error: invokeError } =
        await supabase.functions.invoke("whatsapp-connect", {
          body: {
            action: "disconnect",
            businessId,
          },
        });

      if (invokeError || data?.error) {
        throw new Error(
          data?.error ||
            invokeError?.message ||
            "Could not disconnect WhatsApp.",
        );
      }

      setNotice("WhatsApp has been disconnected.");

      await loadConnection();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not disconnect WhatsApp.",
      );
    } finally {
      setConnecting(false);
    }
  };

  const isConnected =
    connection?.connection_status === "connected" &&
    connection.is_enabled;

  return (
    <section
      className="card space-y-4"
      aria-labelledby="whatsapp-connection-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="whatsapp-connection-heading"
            className="text-base font-bold text-[#17201A] flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5 text-[#15803D]" />
            WhatsApp Business connection
          </h2>

          <p className="text-xs text-[#647067] mt-1">
            Connect {businessName}’s own WhatsApp Business Account
            to Chowza.
          </p>
        </div>

        {isConnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F9EC] px-2.5 py-1 text-xs font-semibold text-[#166534]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected
          </span>
        ) : (
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#4B5563]">
            {connection?.connection_status ===
            "reauthorization_required"
              ? "Reconnect required"
              : "Not connected"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[#647067]">
          Checking connection…
        </p>
      ) : isConnected ? (
        <div className="rounded-lg border border-[#D1E7D7] bg-[#F7FCF8] p-3 space-y-1">
          <p className="font-semibold text-sm text-[#17201A]">
            {connection?.verified_name || businessName}
          </p>

          <p className="text-sm text-[#475569]">
            {connection?.display_phone_number ||
              "WhatsApp number connected"}
          </p>

          {connection?.connected_at && (
            <p className="text-xs text-[#647067]">
              Connected{" "}
              {new Date(
                connection.connected_at,
              ).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#647067]">
          Your restaurant will authorize its own Meta business
          assets. Chowza will not ask you to share your WhatsApp
          password.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!isConnected ? (
          <button
            type="button"
            onClick={connect}
            disabled={connecting || loading}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}

            {connecting
              ? "Connecting…"
              : "Connect WhatsApp"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={loadConnection}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={disconnect}
              disabled={connecting}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </button>
          </>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[#647067]">
        Connecting authorizes Chowza to access the WhatsApp
        assets selected in Meta. Disconnecting removes the
        stored Chowza token; it does not delete the restaurant’s
        WhatsApp Business Account.
      </p>
    </section>
  );
};
