import createModel from "./model";

const Payment = createModel("Payment");
export default Payment;

export interface IPayment {
  id?: string;
  _id?: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}
