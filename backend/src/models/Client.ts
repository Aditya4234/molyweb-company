import createModel from "./model";

const Client = createModel("Client");
export default Client;

export interface IClient {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  pincode?: string;
  gstin?: string;
  status: string;
  totalInvoices: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
