import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { renderBusinessPage } from "./dist/server/entry-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(__dirname, "dist");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

/*
|--------------------------------------------------------------------------
| Static assets
|--------------------------------------------------------------------------
*/

app.use(express.static(DIST_DIR));

/*
|--------------------------------------------------------------------------
| Public Business SSR
|--------------------------------------------------------------------------
*/

app.get("/business/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    /*
    |--------------------------------------------------------------------------
    | Load published business
    |--------------------------------------------------------------------------
    */

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address, is_published",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (businessError) {
      console.error("Business lookup failed:", businessError);

      return res
        .status(500)
        .send("Unable to load business.");
    }

    if (!business) {
      return res
        .status(404)
        .send("Business not found.");
    }

    /*
    |--------------------------------------------------------------------------
    | Load available menu items
    |--------------------------------------------------------------------------
    */

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select(
        "id, name, description, price, image_url, is_available, sort_order",
      )
      .eq("business_id", business.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Menu lookup failed:", itemsError);

      return res
        .status(500)
        .send("Unable to load menu.");
    }

    /*
    |--------------------------------------------------------------------------
    | Render business HTML
    |--------------------------------------------------------------------------
    */

    const html = renderBusinessPage(
      business,
      items || [],
    );

    /*
    |--------------------------------------------------------------------------
    | SEO metadata
    |--------------------------------------------------------------------------
    */

    const title = `${business.name} | Chowza`;

    const description =
      business.description ||
      `Order from ${business.name} on Chowza.`;

    const previewImage =
      business.logo_url ||
      "https://chowza.onrender.com/icon.svg";

    const canonicalUrl =
      `https://chowza.onrender.com/business/${encodeURIComponent(slug)}`;

    /*
    |--------------------------------------------------------------------------
    | Structured data
    |--------------------------------------------------------------------------
    */

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: business.name,
      description,
      url: canonicalUrl,
      image: previewImage,
      telephone: business.public_phone || undefined,

      address: business.public_address
        ? {
            "@type": "PostalAddress",
            streetAddress: business.public_address,
          }
        : undefined,

      servesCuisine: "Food",

      provider: {
        "@type": "Organization",
        name: "Chowza",
        url: "https://chowza.onrender.com/",
      },
    };

    /*
    |--------------------------------------------------------------------------
    | Safely serialise JSON-LD
    |--------------------------------------------------------------------------
    */

    const jsonLd = JSON.stringify(structuredData)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

    /*
    |--------------------------------------------------------------------------
    | Complete HTML document
    |--------------------------------------------------------------------------
    */

    const fullHtml = `<!doctype html>
<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeHtml(title)}</title>

  <meta
    name="description"
    content="${escapeHtml(description)}"
  />

  <link
    rel="canonical"
    href="${escapeHtml(canonicalUrl)}"
  />

  <!-- Open Graph -->

  <meta
    property="og:title"
    content="${escapeHtml(title)}"
  />

  <meta
    property="og:description"
    content="${escapeHtml(description)}"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:url"
    content="${escapeHtml(canonicalUrl)}"
  />

  <meta
    property="og:image"
    content="${escapeHtml(previewImage)}"
  />

  <meta
    property="og:image:alt"
    content="${escapeHtml(business.name)} on Chowza"
  />

  <!-- Twitter -->

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content="${escapeHtml(title)}"
  />

  <meta
    name="twitter:description"
    content="${escapeHtml(description)}"
  />

  <meta
    name="twitter:image"
    content="${escapeHtml(previewImage)}"
  />

  <!-- Structured Data -->

  <script type="application/ld+json">${jsonLd}</script>

  <!-- Favicon -->

  <link
    rel="icon"
    type="image/svg+xml"
    href="/icon.svg"
  />

  <!-- Generated CSS -->

  <link
    rel="stylesheet"
    href="${getCssAsset()}"
  />

</head>

<body>

  <div id="root">${html}</div>

  <!-- Tell the client that this page was server-rendered -->

  <script>
    window.__CHOWZA_SSR__ = true;
  </script>

  <!-- Generated React application -->

  <script
    type="module"
    src="${getJsAsset()}"
  ></script>

</body>

</html>`;

    return res.send(fullHtml);

  } catch (error) {

    console.error("SSR error:", error);

    return res
      .status(500)
      .send("Server error.");
  }
});

/*
|--------------------------------------------------------------------------
| Client-side application fallback
|--------------------------------------------------------------------------
|
| Everything else continues to use the normal React application.
|
*/

app.get("*", (req, res) => {
  res.sendFile(
    path.join(DIST_DIR, "index.html"),
  );
});

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Chowza server running on port ${PORT}`,
  );
});

/*
|--------------------------------------------------------------------------
| HTML escaping
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
|--------------------------------------------------------------------------
| Find generated CSS
|--------------------------------------------------------------------------
*/

function getCssAsset() {
  const assetsDir = path.join(
    DIST_DIR,
    "assets",
  );

  const file = fs
    .readdirSync(assetsDir)
    .find((name) => name.endsWith(".css"));

  if (!file) {
    throw new Error(
      "Could not find generated CSS asset.",
    );
  }

  return `/assets/${file}`;
}

/*
|--------------------------------------------------------------------------
| Find generated JavaScript
|--------------------------------------------------------------------------
*/

function getJsAsset() {
  const assetsDir = path.join(
    DIST_DIR,
    "assets",
  );

  const file = fs
    .readdirSync(assetsDir)
    .find(
      (name) =>
        name.endsWith(".js") &&
        name.startsWith("index-"),
    );

  if (!file) {
    throw new Error(
      "Could not find generated JavaScript asset.",
    );
  }

  return `/assets/${file}`;
}