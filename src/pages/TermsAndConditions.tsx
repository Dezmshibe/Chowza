import React from 'react';

export default function TermsAndConditions() {
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

          <h1 className="legal-title">
            Terms &amp;
            <br />
            Conditions
          </h1>

          <p className="legal-intro">
            These Terms and Conditions govern your use of Chowza, an online
            food ordering platform operating in South Africa.
          </p>

          <div className="updated">Last updated: 15 September 2026</div>
        </section>

        <section className="legal-section">
          <h2>1. About Chowza</h2>

          <p>
            Chowza is an online platform that connects customers with
            participating food businesses for ordering and managing food
            orders.
          </p>

          <p>
            Chowza is operated by MSHIBE GROUP. Chowza provides the technology
            and platform through which customers and food businesses can
            interact.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Using Chowza</h2>

          <p>
            By using Chowza, you agree to use the platform lawfully and in
            accordance with these Terms and Conditions.
          </p>

          <p>
            You must provide information that is accurate and reasonably
            necessary to process your order or use the relevant Chowza
            services.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Customer Orders</h2>

          <p>
            Customers are responsible for reviewing their order before
            submitting it, including the selected food items, quantities,
            delivery details and applicable charges.
          </p>

          <p>
            Once an order has been submitted, the relevant food business may
            begin preparing it. Cancellation or changes may therefore not
            always be possible.
          </p>

          <p>
            Food businesses are responsible for accepting, preparing and
            fulfilling customer orders.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Food Businesses</h2>

          <p>
            Participating food businesses are responsible for the information
            they publish on Chowza, including:
          </p>

          <ul>
            <li>Menus</li>
            <li>Prices</li>
            <li>Product descriptions</li>
            <li>Availability</li>
            <li>Food preparation</li>
            <li>Order fulfilment</li>
          </ul>

          <p>
            Chowza provides the technology and platform. Chowza does not
            prepare the food itself.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Pricing and Payments</h2>

          <p>
            Prices displayed on Chowza are provided by participating food
            businesses and may change from time to time.
          </p>

          <p>
            Available payment methods may include cash and third-party online
            payment services.
          </p>

          <p>
            Where a third-party payment provider is used, that provider's own
            terms and conditions may apply.
          </p>

          <p>
            Chowza does not intentionally store complete card or banking
            credentials unless specifically stated.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Chowza Business Subscriptions</h2>

          <p>
            Where Chowza offers paid business subscriptions or platform
            services, the applicable subscription terms and pricing will
            apply to the relevant business.
          </p>

          <p>
            Subscription availability, pricing and features may change from
            time to time.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Promotions</h2>

          <p>
            Promotions, discounts and special offers may be subject to
            additional conditions specified by Chowza or the participating
            food business.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. WhatsApp Communications</h2>

          <p>
            Chowza may use WhatsApp or other communication services to send
            relevant order information, including confirmations and status
            updates where applicable.
          </p>

          <p>
            Third-party communication services may have their own terms and
            privacy policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Intellectual Property</h2>

          <p>
            Chowza's software, branding, visual design and platform materials
            are protected by applicable intellectual property laws.
          </p>

          <p>
            You may not copy, reproduce, modify or commercially exploit Chowza
            materials without appropriate permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Availability of the Service</h2>

          <p>
            Chowza aims to keep the platform available and functional but
            cannot guarantee uninterrupted or error-free operation at all
            times.
          </p>

          <p>
            The service may occasionally be unavailable because of maintenance,
            technical problems, third-party services or circumstances outside
            Chowza's reasonable control.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Third-Party Services</h2>

          <p>
            Chowza may rely on third-party services, including payment,
            communication, hosting and technology providers.
          </p>

          <p>
            Third-party providers may have their own terms, conditions and
            privacy policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Limitation of Responsibility</h2>

          <p>
            Chowza provides the technology platform connecting customers and
            food businesses.
          </p>

          <p>
            Food businesses remain responsible for their menus, prices,
            product information, food preparation, quality, availability and
            fulfilment.
          </p>

          <p>
            Nothing in these Terms is intended to exclude any responsibility
            or consumer right that cannot lawfully be excluded under
            applicable South African law.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Account Security</h2>

          <p>
            Where an account or login is provided, users are responsible for
            keeping their login information reasonably secure and for
            notifying Chowza if they believe their account has been
            compromised.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Privacy</h2>

          <p>
            Personal information handled through Chowza is subject to the
            Chowza Privacy Policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. Suspension or Termination</h2>

          <p>
            Chowza may suspend or terminate access where reasonably necessary,
            including where there is misuse of the platform, unlawful
            activity, security concerns or a material breach of these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>16. Changes to These Terms</h2>

          <p>
            Chowza may update these Terms and Conditions from time to time.
            Updated terms will apply from the date they are published or
            otherwise communicated as applicable.
          </p>
        </section>

        <section className="legal-section">
          <h2>17. Governing Law</h2>

          <p>
            These Terms and Conditions are governed by the laws of the
            Republic of South Africa.
          </p>
        </section>

        <section className="contact-box">
          <h2>18. Contact</h2>

          <p>
            For questions regarding these Terms and Conditions, contact:
          </p>

          <p>
            <strong>MSHIBE GROUP</strong>
            <br />
            Email:{' '}
            <a href="mailto:sinqobilemshibe@gmail.com">
              sinqobilemshibe@gmail.com
            </a>
          </p>
        </section>

        <footer className="legal-footer">
          Chowza — Powered by MSHIBE GROUP.
        </footer>
      </main>
    </div>
  );
}