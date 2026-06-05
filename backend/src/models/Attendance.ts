import createModel from "./model";

const Attendance = createModel("Attendance");
export default Attendance;

export interface IAttendance {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  createdAt: Date;
  updatedAt: Date;
}
