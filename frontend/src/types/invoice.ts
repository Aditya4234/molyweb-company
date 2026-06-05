export interface InvoiceItem {
  id: string;
  name: string;
  hsnSac?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  total: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  phone: string;
  email: string;
}

export interface GSTBreakdown {
  taxableValue: number;
  cgst: { rate: number; amount: number };
  sgst: { rate: number; amount: number };
  igst: { rate: number; amount: number };
  totalGst: number;
}

export interface InvoiceFormData {
  client: ClientInfo;
  items: InvoiceItem[];
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  discount: number;
  discountType: "percentage" | "fixed";
  currency: string;
  notes: string;
  terms: string;
  gstType: "cgst_sgst" | "igst";
  subject: string;
  placeOfSupply: string;
  project: string;
  paidAmount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  gstBreakdown: GSTBreakdown;
  grandTotal: number;
}

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GstRate = (typeof GST_RATES)[number];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
