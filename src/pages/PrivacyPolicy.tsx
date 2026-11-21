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
            This Privacy Policy explains how Chowza collects, uses, stores,
            shares and protects personal information when you use our
            platform in South Africa.
          </p>

          <div className="updated">
            Last updated: 21 November 2026
          </div>
        </section>

        <section className="legal-section">
          <h2>1. Introduction</h2>

          <p>
            Chowza is a food ordering and business platform operated by
            MSHIBE GROUP. It allows customers to discover participating
            food businesses, view menus and place orders, including
            orders through WhatsApp where that feature is available.
          </p>

          <p>
            This policy applies to customers, food businesses and their
            authorised representatives who use Chowza.
          </p>

          <p>
            We handle personal information in accordance with applicable
            South African data protection laws, including the Protection
            of Personal Information Act (POPIA), where applicable.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>

          <p>
            The information we collect depends on how you use Chowza.
            It may include the following:
          </p>

          <h3>Customer information</h3>
          <ul>
            <li>Name and contact details, including phone number</li>
            <li>Delivery address and delivery instructions</li>
            <li>Order details, order history and customer notes</li>
            <li>Payment status and relevant transaction references</li>
            <li>Communications relating to orders and customer support</li>
          </ul>

          <h3>Food business information</h3>
          <ul>
            <li>Business name and contact information</li>
            <li>Owner or authorised representative details</li>
            <li>Menu items, descriptions and prices</li>
            <li>Business photographs, operating hours and service information</li>
            <li>Orders and information needed to manage business activity</li>
          </ul>

          <h3>WhatsApp integration information</h3>
          <p>
            Where a food business connects WhatsApp to Chowza, we may
            process relevant integration information such as WhatsApp
            Business Account identifiers, phone number identifiers,
            connection status and authorisation information.
          </p>

          <h3>Technical information</h3>
          <ul>
            <li>IP address and browser information</li>
            <li>Device and usage information</li>
            <li>Login activity and security logs</li>
            <li>Technical errors and diagnostic information</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>

          <p>We may use personal information to:</p>
          <ul>
            <li>Create and manage customer and business accounts</li>
            <li>Display food business menus and information</li>
            <li>Process, manage and track customer orders</li>
            <li>Communicate order confirmations and status updates</li>
            <li>Support delivery and order fulfilment</li>
            <li>Enable WhatsApp ordering and notifications where available</li>
            <li>Facilitate payment processing where enabled</li>
            <li>Provide customer and business support</li>
            <li>Maintain, improve and secure the Chowza platform</li>
            <li>Detect and prevent fraud, misuse and unauthorised access</li>
            <li>Meet applicable legal and regulatory obligations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. WhatsApp and Meta Services</h2>

          <p>
            Chowza may provide WhatsApp integration features that allow
            participating food businesses to connect their WhatsApp
            Business accounts and manage relevant customer communications.
          </p>

          <p>
            When these features are used, information necessary to
            establish and operate the integration may be processed,
            including account identifiers, phone number identifiers,
            connection details and relevant order information.
          </p>

          <p>
            WhatsApp and Meta process information under their own terms
            and privacy policies. Their services are subject to their
            respective policies and requirements.
          </p>

          <p>
            Food businesses are responsible for ensuring that their use
            of WhatsApp and customer communications complies with
            applicable laws and platform requirements.
          </p>

          <p>
            You can review their policies here:
          </p>
          <ul>
            <li>
              <a href="https://www.whatsapp.com/legal/privacy-policy"
                 target="_blank" rel="noopener noreferrer">
                WhatsApp Privacy Policy
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/privacy/policy/"
                 target="_blank" rel="noopener noreferrer">
                Meta Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Payments</h2>

          <p>
            Where online payments are available, transactions may be
            processed by third-party payment service providers.
            These providers handle payment information in accordance
            with their own security practices and privacy policies.
          </p>

          <p>
            Chowza may receive payment-related information such as
            payment status, transaction references and confirmation
            details needed to manage an order.
          </p>

          <p>
            Food businesses may receive relevant payment status
            information to help them determine whether an order has
            been paid or is awaiting payment.
          </p>

          <p>
            Chowza does not intentionally store complete payment card
            details or banking credentials unless expressly stated
            for a particular service.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. How We Share Information</h2>

          <p>
            We may share relevant information where necessary to
            operate Chowza and provide its services, including with:
          </p>

          <ul>
            <li>
              Participating food businesses, so they can receive,
              manage and fulfil customer orders
            </li>
            <li>
              Technology and infrastructure providers that help
              operate and maintain the platform
            </li>
            <li>
              Meta and WhatsApp, where WhatsApp integration features
              are used
            </li>
            <li>
              Payment service providers, where payment processing
              is enabled
            </li>
            <li>
              Professional advisers, regulators or law enforcement
              authorities where legally required
            </li>
          </ul>

          <p>
            We do not sell personal information to third parties.
            Information is shared only where reasonably necessary
            for the purposes described in this policy or where
            otherwise permitted or required by law.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Storage and Processing of Information</h2>

          <p>
            Chowza uses third-party technology and infrastructure
            services to operate the platform. Personal information
            may be stored or processed in South Africa or other
            countries, depending on the services and providers used.
          </p>

          <p>
            Where personal information is transferred outside
            South Africa, we aim to ensure that appropriate
            safeguards are applied as required by applicable law,
            including POPIA.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Information Security</h2>

          <p>
            We take reasonable technical and organisational measures
            intended to protect information processed through Chowza
            against unauthorised access, misuse, alteration, loss
            or disclosure.
          </p>

          <p>
            These measures may include access controls, authentication,
            security monitoring and appropriate platform safeguards.
          </p>

          <p>
            However, no online system or method of electronic storage
            or transmission can be guaranteed to be completely secure.
          </p>

          <p>
            Where a security compromise occurs, we will take appropriate
            steps in accordance with applicable legal requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Information Retention</h2>

          <p>
            We retain personal information only for as long as
            reasonably necessary for the purposes for which it was
            collected, including providing services, maintaining
            business records, resolving disputes, meeting legal
            obligations and protecting the platform.
          </p>

          <p>
            When information is no longer required, we will take
            reasonable steps to delete, destroy or de-identify it,
            subject to any applicable legal retention requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Your Privacy Rights</h2>

          <p>
            Subject to applicable law, you may have the right to:
          </p>

          <ul>
            <li>Request access to personal information we hold about you</li>
            <li>Request correction or updating of inaccurate information</li>
            <li>Request deletion or destruction where legally permitted</li>
            <li>Object to certain forms of processing</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>
              Lodge a complaint with the Information Regulator
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>11. Requests About Your Personal Information</h2>

          <p>
            To make a privacy-related request, contact us using the
            email address provided in the Contact section.
          </p>

          <p>
            Please use the subject line:
            <strong> Chowza – Personal Information Request</strong>.
          </p>

          <p>
            Include enough information for us to understand your
            request. We may ask for reasonable proof of identity
            before providing access to personal information or
            making certain changes.
          </p>

          <p>
            We will handle requests in accordance with applicable
            legal requirements. Some information may need to be
            retained where there is a lawful reason to do so.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Cookies and Similar Technologies</h2>

          <p>
            Chowza may use cookies, local storage or similar
            technologies where necessary to support website
            functionality, remember preferences, maintain sessions
            and improve platform security.
          </p>

          <p>
            You can manage cookies through your browser settings.
            Disabling certain technologies may affect some
            website features.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Children's Information</h2>

          <p>
            Chowza is not intended to knowingly collect children's
            personal information unlawfully. Where information
            relating to a child is processed, we will do so only
            where permitted by applicable law and where any
            required authorisation or consent has been obtained.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Third-Party Services and Links</h2>

          <p>
            Chowza may connect with or contain links to third-party
            services, websites and platforms. These services operate
            under their own terms and privacy policies.
          </p>

          <p>
            We encourage users to review the privacy policies of
            third-party services before providing them with personal
            information.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. Changes to This Privacy Policy</h2>

          <p>
            We may update this Privacy Policy from time to time to
            reflect changes to Chowza, our services, information
            practices or applicable legal requirements.
          </p>

          <p>
            Any updated version will be published on this page with
            a revised last-updated date.
          </p>
        </section>

        <section className="contact-box">
          <h2>16. Contact Chowza</h2>

          <p>
            If you have questions about this Privacy Policy or
            wish to make a request concerning your personal
            information, contact:
          </p>

          <p>
            <strong>MSHIBE GROUP</strong>
            <br />
            Platform: Chowza
            <br />
            Email:{' '}
            <a href="mailto:mshibegroup@gmail.com">
              mshibegroup@gmail.com
            </a>
            <br />
            Website:{' '}
            <a href="https://chowza.onrender.com">
              https://chowza.onrender.com
            </a>
          </p>
        </section>

        <section className="legal-section">
          <h2>17. South African Information Regulator</h2>

          <p>
            If you believe your personal information has been
            handled unlawfully, you may contact the Information
            Regulator of South Africa.
          </p>

          <p>
            <a href="https://inforegulator.org.za/"
               target="_blank" rel="noopener noreferrer">
              Information Regulator – South Africa
            </a>
          </p>
        </section>

        <footer className="legal-footer">
          © 2026 Chowza. Powered by MSHIBE GROUP.
        </footer>
      </main>
    </div>
  );
}
