import { ArrowLeft } from 'lucide-react';

type RefundPolicyProps = {
  onBack?: () => void;
};

export default function RefundPolicy({ onBack }: RefundPolicyProps) {
  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="border-b border-[#D7E2DA] bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-[#D7E2DA] p-2 text-[#166534] hover:bg-[#F7FAF7]"
              aria-label="Go back"
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#166534]">
              Chowza
            </p>
            <h1 className="text-xl font-black">Refund & Cancellation Policy</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
        <article className="rounded-3xl border border-[#D7E2DA] bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-8 text-sm text-[#647067]">
            <strong>Last updated:</strong> 3 November 2026
          </p>

          <p className="leading-7 text-[#47524A]">
            Chowza wants customers to receive the food they ordered in an
            acceptable condition and within the agreed ordering process.
          </p>

          <p className="mt-4 leading-7 text-[#47524A]">
            Because food is generally perishable, cancellation and change-of-mind
            refunds may be restricted once an order has been accepted or
            preparation has started. These restrictions do not remove any
            consumer rights that cannot legally be excluded.
          </p>

          {[
            ['1. When Can I Cancel an Order?', [
              'You should request cancellation as soon as possible after placing an order.',
              'Before the business accepts the order, Chowza may allow the order to be cancelled. Where payment has already been made, an approved cancellation will normally result in the applicable payment being refunded.',
              'Once the business has accepted the order, preparation may begin. Cancellation may therefore no longer be possible, particularly where the food has already been prepared.',
              'Orders generally cannot be cancelled simply because the customer has changed their mind after preparation has started. This does not affect legal rights where the food is defective, unsafe, materially different from what was ordered, or another legally recognised refund right applies.',
            ]],
            ['2. Wrong Order', [
              'If you receive food that is materially different from what you ordered, contact Chowza or the relevant business as soon as possible.',
              'Where the complaint is verified, the customer may receive an appropriate remedy, which may include replacement of the incorrect item, replacement of the affected order, or a refund for the affected item or order.',
            ]],
            ['3. Missing Items', [
              'If an item paid for is missing from your order, report it as soon as possible.',
              'After verification, Chowza or the relevant business may provide the missing item where reasonably possible or a refund for the missing item.',
            ]],
            ['4. Damaged or Unsafe Food', [
              'If food arrives damaged, contaminated, unsafe or materially unsuitable for consumption, do not consume it.',
              'Contact Chowza or the relevant business as soon as possible and provide your order number, a description of the problem, photographs where appropriate and any other information reasonably required to investigate the complaint.',
              'Where a food product fails applicable consumer-quality requirements, the customer may have rights to an appropriate remedy under South African law, including a refund where applicable.',
            ]],
            ['5. Food Quality Complaints', [
              'A customer should report a serious food-quality complaint as soon as reasonably possible after receiving the order.',
              'Chowza may request photographs or other information to determine what happened.',
              'Minor differences in appearance, portion presentation or preparation do not automatically constitute a defect where the food substantially matches the description provided by the business.',
            ]],
            ['6. Order Not Delivered', [
              'If an order has been paid for but is not delivered, contact Chowza or the relevant business.',
              'Where the business or delivery process is responsible for the failed delivery and the order cannot reasonably be fulfilled, an appropriate refund may be issued.',
              'Customers remain responsible for providing accurate delivery information and being reasonably available to receive the order.',
            ]],
            ['7. Business Cancels an Order', [
              'A business may cancel an order where it cannot fulfil the order, including where the business has run out of an item, has closed, has an operational problem, cannot fulfil the order within a reasonable time, or circumstances outside its reasonable control prevent fulfilment.',
              'Where a customer has already paid for an order that the business cancels and the order cannot be fulfilled, the applicable amount paid will be refunded.',
            ]],
            ['8. Duplicate Payments', [
              'If a customer is charged more than once for the same order due to a payment or technical error, the duplicate amount will be investigated.',
              'Once confirmed, the duplicate payment will be refunded.',
            ]],
            ['9. Cash Orders', [
              'For orders selected as cash or payment-in-person orders, no card refund is applicable because the customer has not made an online card payment.',
              'If the customer has already paid cash and qualifies for a refund, the relevant business and/or Chowza will communicate the applicable refund method.',
            ]],
            ['10. Card and Online Payments', [
              'Where an approved refund relates to an online payment, the refund will generally be processed back through the original payment method where technically and legally possible.',
              'The time for the funds to appear in the customer’s account may depend on the payment provider or financial institution.',
            ]],
            ['11. Promotions and Discounted Orders', [
              'Where only part of an order qualifies for a refund, the value of a promotional discount may be taken into account when calculating the refund.',
              'A promotion does not remove statutory consumer rights.',
            ]],
            ['12. Customer Change of Mind', [
              'Because prepared food is generally perishable and intended for immediate consumption, customers should not assume that they can cancel or return an order after preparation simply because they have changed their mind.',
              'South African electronic-transaction law excludes certain foodstuffs and goods intended for everyday consumption from the ECTA seven-day cooling-off provision.',
              'This does not affect other rights that may apply where food is defective, unsafe, incorrect or otherwise fails to meet applicable legal requirements.',
            ]],
            ['13. Refund Processing', [
              'Once a refund has been approved, Chowza will initiate the refund using the applicable payment method.',
              'The time required for the refund to appear in the customer’s account may vary depending on the payment provider and financial institution.',
              'Where legislation requires a particular refund period, that statutory period will apply.',
            ]],
            ['14. How to Request a Refund', [
              'To request a refund, contact Chowza through the support/contact method displayed on the platform.',
              'Include your order number, name and contact details, the reason for requesting a refund, the affected food item(s), and photographs or other supporting evidence where appropriate.',
              'Providing complete information helps Chowza and the relevant business investigate the matter quickly.',
            ]],
            ['15. Investigation of Refund Requests', [
              'Chowza may communicate with the relevant food business to verify a complaint.',
              'This may include reviewing order information, payment records, order status, preparation information, customer communications, delivery information and photographs or other evidence.',
              'A customer will not be denied a legally required remedy merely because an internal investigation is required.',
            ]],
            ['16. Fraudulent or Abusive Refund Claims', [
              'Chowza may investigate repeated, suspicious or potentially fraudulent refund claims.',
              'Where there is reasonable evidence of abuse or fraud, Chowza may restrict account functionality or take other lawful action.',
              'Nothing in this section limits legitimate consumer rights.',
            ]],
            ['17. Your Legal Rights', [
              'This policy does not replace or restrict rights provided to consumers by applicable South African law.',
              'Where this policy conflicts with a mandatory consumer protection requirement, the applicable law will prevail.',
            ]],
            ['18. Changes to This Policy', [
              'Chowza may update this Refund & Cancellation Policy from time to time.',
              'The latest version will be published on the Chowza platform.',
            ]],
            ['19. Contact', [
              'For refund or cancellation assistance, contact Chowza through the support/contact method displayed on the Chowza website or application.',
              'Please keep your order number available when contacting support.',
            ]],
          ].map(([heading, paragraphs]) => (
            <section key={Array.isArray(heading) ? heading.join("-") : heading} className="mt-9">
              <h2 className="text-lg font-black text-[#166534]">{heading}</h2>
              <div className="mt-3 space-y-3">
                {(paragraphs as string[]).map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-[#47524A]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-10 border-t border-[#D7E2DA] pt-6 text-sm font-semibold text-[#166534]">
            Chowza — This Refund & Cancellation Policy should be read together
            with the Chowza Terms & Conditions and Privacy Policy.
          </div>
        </article>
      </main>
    </div>
  );
}
