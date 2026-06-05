import createModel from "./model";

const BillingPlan = createModel("BillingPlan");
export default BillingPlan;

export interface IBillingPlan {
  id?: string;
  _id?: string;
  clientId: string;
  clientName: string;
  plan: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}
