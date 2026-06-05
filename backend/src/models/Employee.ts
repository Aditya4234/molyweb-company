import createModel from "./model";

const Employee = createModel("Employee");
export default Employee;

export interface IEmployee {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  status: string;
  joinDate: string;
  address: string;
  bankAccount?: string;
  ifscCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
