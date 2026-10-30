import React from 'react';

export default function PrivacyPolicy() {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="legal-page">
      <style>{`
        .legal-page {
          min-height: 100vh;
          background: #F7FAF7;
          color: #17201A;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .legal-header {
          background: #15803D;
          color: white;
          padding: 20px 24px;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 4px 18px rgba(21,128,61,.15);
        }

        .legal-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-button {
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.10);
          color: white;
          border-radius: 12px;
          padding: 9px 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
        }

        .back-button:hover {
          background: rgba(255,255,255,.18);
        }

        .brand {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .powered {
          font-size: 11px;
          opacity: .75;
          margin-top: 2px;
        }

        .legal-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 52px 24px 80px;
        }

        .legal-hero {
          margin-bottom: 42px;
        }

        .eyebrow {
          display: inline-block;
          color: #15803D;
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 16px;
        }

        .legal-title {
          font-size: clamp(36px, 7vw, 58px);
          line-height: .98;
          letter-spacing: -.055em;
          margin: 0 0 18px;
          font-weight: 900;
        }

        .legal-intro {
          color: #647067;
          font-size: 17px;
          line-height: 1.7;
          max-width: 720px;
        }

        .updated {
          display: inline-block;
          margin-top: 18px;
          background: white;
          border: 1px solid #D7E2DA;
          color: #647067;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
        }

        .legal-section {
          margin-top: 42px;
        }

        .legal-section h2 {
          font-size: 24px;
          letter-spacing: -.025em;
          margin: 0 0 14px;
          color: #17201A;
        }

        .legal-section p {
          font-size: 15.5px;
          line-height: 1.8;
          color: #526058;
          margin: 0 0 14px;
        }

        .legal-section ul {
          margin: 10px 0 18px;
          padding-left: 23px;
          color: #526058;
        }

        .legal-section li {
          font-size: 15.5px;
          line-height: 1.8;
          margin-bottom: 7px;
        }

        .contact-box {
          margin-top: 45px;
          background: #15803D;
          color: white;
          padding: 28px;
          border-radius: 20px;
          box-shadow: 0 12px 30px rgba(21,128,61,.14);
        }

        .contact-box h2 {
          margin-top: 0;
          font-size: 22px;
        }

        .contact-box p {
          color: rgba(255,255,255,.82);
          line-height: 1.7;
        }

        .contact-box a {
          color: white;
          font-weight: 700;
        }

        .legal-footer {
          border-top: 1px solid #D7E2DA;
          margin-top: 55px;
          padding-top: 25px;
          color: #7A857D;
          font-size: 13px;
          line-height: 1.7;
        }

        @media (max-width: 600px) {
          .legal-header {
            padding: 17px;
          }

          .legal-container {
            padding: 38px 18px 60px;
          }

          .legal-section {
            margin-top: 34px;
          }

          .legal-section h2 {
            font-size: 21px;
          }
        }
      `}</style>

      <header className="legal-header">
        <div className="legal-header-inner">
          <button className="back-button" onClick={goBack}>
            ← Back
          </button>

          <div>
            <div className="brand">Chowza</div>
            <div className="powered">Powered by MSHIBE GROUP</div>
          </div>
        </div>
      </header>

      <main className="legal-container">
        <section className="legal-hero">
          <div className="eyebrow">Legal</div>

          <h1 className="legal-title">Privacy Policy</h1>

          <p className="legal-intro">
            This Privacy Policy explains how Chowza collects, uses, protects
            and retains information when you use the Chowza platform in South
            Africa.
          </p>

          <div className="updated">
            Last updated: 15 September 2026
          </div>
        </section>

        <section className="legal-section">
          <h2>1. Information We Collect</h2>

          <p>
            Depending on how you use Chowza, we may collect information
            including:
          </p>

          <ul>
            <li>Your name</li>
            <li>Your phone number</li>
            <li>Your delivery address</li>
            <li>Order details</li>
            <li>Customer notes provided with an order</li>
            <li>Information provided by food businesses</li>
            <li>
              Technical and security information necessary to operate and
              protect the platform
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Your Information</h2>

          <p>We may use information collected through Chowza to:</p>

          <ul>
            <li>Process and manage customer orders</li>
            <li>Communicate with customers about their orders</li>
            <li>Send order status notifications through WhatsApp where applicable</li>
            <li>Allow participating food businesses to manage and fulfil orders</li>
            <li>Improve and maintain Chowza</li>
            <li>Protect the platform against fraud, misuse and security threats</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. WhatsApp Communications</h2>

          <p>
            Where WhatsApp communications are used, Chowza may process the
            phone number and order information necessary to send relevant
            communications, such as order confirmations or status updates.
          </p>

          <p>
            WhatsApp is a third-party service and its own terms and privacy
            policies may also apply.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Payments</h2>

          <p>
            Payments may be processed through third-party payment providers.
            Payment information is handled according to the applicable
            provider's policies and systems.
          </p>

          <p>
            Chowza does not intentionally store complete card or banking
            credentials unless specifically stated.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Information Security</h2>

          <p>
            We take reasonable measures intended to protect information
            processed through Chowza against unauthorised access, misuse,
            alteration or disclosure.
          </p>

          <p>
            However, no online system can be guaranteed to be completely
            secure.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Information Retention</h2>

          <p>
            Information may be retained for as long as reasonably necessary
            to provide Chowza services, maintain business records, resolve
            disputes, comply with legal obligations and protect the platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights</h2>

          <p>
            Depending on applicable law, you may have rights relating to your
            personal information, including the ability to request access to
            or correction of information held about you.
          </p>

          <p>
            Requests can be directed to the contact details provided below.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Information</h2>

          <p>
            Chowza is not intended to knowingly collect personal information
            from children where doing so would be unlawful.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy from time to time to reflect
            changes to Chowza, our information practices or applicable
            requirements.
          </p>
        </section>

        <section className="contact-box">
          <h2>10. Contact</h2>

          <p>
            If you have questions about this Privacy Policy or the way Chowza
            handles information, please contact:
          </p>

          <p>
            <strong>MSHIBE GROUP</strong>
            <br />
            Email:{' '}
            <a href="mailto:mshibegroup@gmail.com">
              mshibegroup@gmail.com
            </a>
          </p>
        </section>

        <footer className="legal-footer">
          This Privacy Policy is a general starting point and should be
          reviewed against the final Chowza structure, data flows and
          applicable South African privacy requirements before production
          launch.
        </footer>
      </main>
    </div>
  );
}