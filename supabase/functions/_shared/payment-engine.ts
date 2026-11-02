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
  const businessCommission = Number(businessValue);
  if (businessValue !== null && businessValue !== undefined && businessValue !== "" && Number.isFinite(businessCommission)) {
    return businessCommission;
  }

  const configured = Number(
    Deno.env.get("CHOWZA_COMMISSION_PERCENT") ?? "",
  );

  if (Number.isFinite(configured)) {
    return configured;
  }

  throw new Error(
    "CHOWZA_COMMISSION_PERCENT is not configured and this business has no commission setting.",
  );
}
