import createModel from "./model";

const Department = createModel("Department");
export default Department;

export interface IDepartment {
  id?: string;
  _id?: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
