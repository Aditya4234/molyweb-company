import createModel from "./model";

const LoginAudit = createModel("LoginAudit");
export default LoginAudit;

export interface ILoginAudit {
  id?: string;
  _id?: string;
  userId?: string;
  email: string;
  ipAddress: string;
  status: string;
  reason?: string;
  createdAt: Date;
}
