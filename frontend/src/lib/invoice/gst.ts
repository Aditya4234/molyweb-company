import type { InvoiceItem, GSTBreakdown, InvoiceTotals } from "@/types/invoice";

export function calculateGST(
  taxableValue: number,
  gstRate: number,
  type: "cgst_sgst" | "igst" = "cgst_sgst",
): GSTBreakdown {
  const totalGst = (taxableValue * gstRate) / 100;

  if (type === "igst") {
    return {
      taxableValue,
      cgst: { rate: 0, amount: 0 },
      sgst: { rate: 0, amount: 0 },
      igst: { rate: gstRate, amount: totalGst },
      totalGst,
    };
  }

  const halfRate = gstRate / 2;
  const halfAmount = totalGst / 2;

  return {
    taxableValue,
    cgst: { rate: halfRate, amount: halfAmount },
    sgst: { rate: halfRate, amount: halfAmount },
    igst: { rate: 0, amount: 0 },
    totalGst,
  };
}

export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  gstRate: number,
  gstType: "cgst_sgst" | "igst",
): { total: number; gst: GSTBreakdown } {
  const subtotal = quantity * unitPrice;
  const gst = calculateGST(subtotal, gstRate, gstType);
  return { total: subtotal + gst.totalGst, gst };
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discount: number,
  discountType: "percentage" | "fixed",
  gstType: "cgst_sgst" | "igst",
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const taxableValue = subtotal - discountAmount;

  const totalGstAmount = items.reduce((sum, item) => {
    const gst = calculateGST(item.quantity * item.unitPrice, item.gstRate, gstType);
    return sum + gst.totalGst;
  }, 0);

  const gstBreakdown = calculateGST(taxableValue, 0, gstType);
  gstBreakdown.totalGst = totalGstAmount;
  if (gstType === "cgst_sgst") {
    gstBreakdown.cgst.amount = totalGstAmount / 2;
    gstBreakdown.sgst.amount = totalGstAmount / 2;
  } else {
    gstBreakdown.igst.amount = totalGstAmount;
  }

  return {
    subtotal,
    discountAmount,
    taxableValue,
    gstBreakdown,
    grandTotal: taxableValue + totalGstAmount,
  };
}

export function formatIndianNumber(amount: number): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function getGstSlabLabel(rate: number): string {
  if (rate === 0) return "NIL";
  return `${rate}%`;
}
