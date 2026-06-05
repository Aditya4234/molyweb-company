import createModel from "./model";

const LeaveRequest = createModel("LeaveRequest");
export default LeaveRequest;

export interface ILeaveRequest {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
