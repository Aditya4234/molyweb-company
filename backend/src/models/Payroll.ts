import createModel from "./model";

const Payroll = createModel("Payroll");
export default Payroll;

export interface IPayroll {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate?: string;
  createdAt: Date;
  updatedAt: Date;
}
