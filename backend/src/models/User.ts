import createModel from "./model";

const User = createModel("User");
export default User;

export interface IUser {
  id?: string;
  _id?: string;
  email: string;
  password?: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  department?: string;
  employeeId?: string;
  createdBy?: string;
  loginAttempts: number;
  lockUntil?: Date;
  provider: "credentials" | "google";
  googleId?: string;
  avatar?: string;
  lastLogin?: Date;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword?(candidatePassword: string): Promise<boolean>;
  save?(): Promise<void>;
  createdAt: Date;
  updatedAt: Date;
}
