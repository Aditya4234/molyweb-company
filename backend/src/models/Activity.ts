import createModel from "./model";

const Activity = createModel("Activity");
export default Activity;

export interface IActivity {
  id?: string;
  _id?: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
