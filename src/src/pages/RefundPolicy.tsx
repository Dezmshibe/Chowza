import React from 'react';

export default function RefundPolicy() {
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

  .notice {
    background: #F0FDF4;
    border: 1px solid #DCFCE7;
    border-radius: 16px;
    padding: 20px;
    margin-top: 25px;
    color: #166534;
  }

  .notice strong {
    display: block;
    margin-bottom: 7px;
    color: #15803D;
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
            Refund &amp;
            <br />
            Cancellation
          </h1>

          <p className="legal-intro">
            This policy explains how cancellations, refunds and order issues
            are handled when using Chowza.
          </p>

          <div className="updated">Last updated: 29 October 2026</div>
        </section>

        <section className="legal-section">
          <h2>1. About This Policy</h2>

          <p>
            Chowza is operated by MSHIBE GROUP and provides a platform that
            connects customers with participating food businesses.
          </p>

          <p>
            The food business is responsible for preparing and fulfilling the
            customer's food order.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Payment Methods</h2>

          <p>
            Chowza may support different payment methods depending on the
            participating business.
          </p>

          <p>
            Online payments may be processed through a third-party payment
            provider such as PayFast. Chowza does not intentionally store
            complete card or banking credentials.
          </p>

          <p>
            For cash orders, payment is made directly to the relevant food
            business.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Customer Cancellations</h2>

          <p>
            Customers should request cancellation as soon as possible after
            placing an order.
          </p>

          <p>
            A cancellation may be accepted where the food business has not
            started preparing the order.
          </p>

          <p>
            Once preparation has started, cancellation may no longer be
            possible because the business may already have incurred costs in
            preparing the order.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Business Cancellations</h2>

          <p>
            A food business may need to cancel an order in circumstances such
            as:
          </p>

          <ul>
            <li>An ordered item being unavailable</li>
            <li>The business being unable to fulfil the order</li>
            <li>Temporary business closure</li>
            <li>Technical or operational issues</li>
            <li>Other circumstances preventing fulfilment</li>
          </ul>

          <p>
            Where an online-paid order is cancelled because the business
            cannot fulfil it, the customer may be eligible for a refund.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Incorrect, Missing or Poor-Quality Orders</h2>

          <p>
            If an order is incorrect, incomplete or has another significant
            issue, customers should contact the relevant food business as
            soon as reasonably possible.
          </p>

          <p>
            Depending on the circumstances, the business may provide a
            correction, replacement, partial refund or full refund where
            appropriate.
          </p>

          <div className="notice">
            <strong>Important</strong>
            The food business is responsible for food preparation, food
            quality, safety, packaging and fulfilment.
          </div>
        </section>

        <section className="legal-section">
          <h2>6. Online Payment Refunds</h2>

          <p>
            Where a refund is approved for an online-paid order, the refund
            will be processed through the applicable payment and refund
            process.
          </p>

          <p>
            The time required for the refund to appear may depend on the
            payment provider and the customer's bank or financial
            institution.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Cash Orders</h2>

          <p>
            Cash orders do not involve an online payment through Chowza.
          </p>

          <p>
            Where a dispute concerns cash paid directly to a food business,
            the customer should raise the matter directly with that business.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Duplicate or Incorrect Payments</h2>

          <p>
            If you believe that you have been charged incorrectly or that a
            payment was duplicated, contact Chowza with the relevant order
            information.
          </p>

          <p>
            Where possible, provide:
          </p>

          <ul>
            <li>Your order number</li>
            <li>Your name</li>
            <li>The amount involved</li>
            <li>Relevant payment information or proof of payment</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Refund Requests</h2>

          <p>
            Refund requests should be submitted as soon as reasonably possible
            after the issue occurs.
          </p>

          <p>
            Chowza may need to obtain information from the relevant food
            business and/or payment provider before determining how an issue
            should be resolved.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Consumer Rights</h2>

          <p>
            Nothing in this Refund &amp; Cancellation Policy is intended to
            exclude or limit any consumer right that cannot lawfully be
            excluded under applicable South African law.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Changes to This Policy</h2>

          <p>
            Chowza may update this policy from time to time to reflect changes
            to the platform, payment processes, business requirements or
            applicable law.
          </p>
        </section>

        <section className="contact-box">
          <h2>12. Contact</h2>

          <p>
            For refund, cancellation or order-related queries, contact:
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
          Chowza — Powered by MSHIBE GROUP.
        </footer>
      </main>
    </div>
  );
}