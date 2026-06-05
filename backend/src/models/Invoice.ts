import createModel from "./model";

const Invoice = createModel("Invoice");
export default Invoice;

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice {
  id?: string;
  _id?: string;
  clientId: string;
  clientName: string;
  email: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  items: IInvoiceItem[];
  invoiceDate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
