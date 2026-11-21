export type PaymentSplit = {
  grossAmount: number;
  commissionPercent: number;
  platformFee: number;
  businessAmount: number;
};

export function calculatePaymentSplit(
  grossAmount: number,
  commissionPercent: number,
): PaymentSplit {
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error("Invalid gross payment amount.");
  }

  if (
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    throw new Error("Invalid Chowza commission percentage.");
  }

  const platformFee = Number(
    ((grossAmount * commissionPercent) / 100).toFixed(2),
  );

  const businessAmount = Number(
    (grossAmount - platformFee).toFixed(2),
  );

  return {
    grossAmount: Number(grossAmount.toFixed(2)),
    commissionPercent,
    platformFee,
    businessAmount,
  };
}


export function getConfiguredCommissionPercent(
  businessValue: unknown,
): number {
  if (
    businessValue !== null &&
    businessValue !== undefined &&
    businessValue !== ""
  ) {
    const businessCommission = Number(businessValue);

    if (
      Number.isFinite(businessCommission) &&
      businessCommission >= 0 &&
      businessCommission <= 100
    ) {
      return businessCommission;
    }

    throw new Error("Invalid business commission percentage.");
  }

  const rawConfigured = Deno.env
    .get("CHOWZA_COMMISSION_PERCENT")
    ?.trim();

  if (!rawConfigured) {
    throw new Error(
      "CHOWZA_COMMISSION_PERCENT is missing or empty.",
    );
  }

  const configured = Number(rawConfigured);

  if (
    !Number.isFinite(configured) ||
    configured < 0 ||
    configured > 100
  ) {
    throw new Error(
      "CHOWZA_COMMISSION_PERCENT must be between 0 and 100.",
    );
  }

  return configured;
}


  throw new Error(
    "CHOWZA_COMMISSION_PERCENT is not configured and this business has no commission setting.",
  );

