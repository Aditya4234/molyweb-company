export interface Invoice {
  id: string;
  clientName: string;
  email: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "draft";
  createdAt: string;
  items?: number;
}

export interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
  prefix?: string;
  suffix?: string;
}

export interface Activity {
  id: string;
  type: "payment" | "invoice" | "client" | "failed" | "refund";
  message: string;
  timestamp: string;
  user?: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface PaymentStatus {
  label: string;
  value: number;
  color: string;
  amount: number;
}

export interface DashboardData {
  stats: Stat[];
  invoices: Invoice[];
  recentActivity: Activity[];
  monthlyRevenue: MonthlyRevenue[];
  paymentStatus: PaymentStatus[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// ====== Employee Management Types ======

export type EmploymentType = "full-time" | "part-time" | "contract" | "intern" | "probation";
export type EmployeeStatus = "active" | "inactive" | "on-leave";
export type Gender = "male" | "female" | "other";
export type LeaveType = "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent" | "half-day" | "wfh" | "leave" | "holiday";
export type PayrollStatus = "paid" | "pending" | "processing";

export interface Department {
  id: string;
  name: string;
  headId?: string;
  headName?: string;
  employeeCount: number;
  budget: number;
  createdAt: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  level: number;
  salaryMin: number;
  salaryMax: number;
}

export interface BankDetails {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
}

export interface DocumentDetails {
  pan: string;
  aadhar: string;
  uan: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basic: number;
  hra: number;
  da: number;
  travelAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  effectiveFrom: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  department: string;
  departmentId: string;
  designation: string;
  designationId: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joiningDate: string;
  exitDate?: string;
  bankDetails: BankDetails;
  documents: DocumentDetails;
  salary: SalaryStructure;
  reportingManager?: string;
  workLocation: string;
  emergencyContact: string;
  emergencyPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  overtime?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  appliedOn: string;
}

export interface LeaveBalance {
  sick: { total: number; used: number; remaining: number };
  casual: { total: number; used: number; remaining: number };
  earned: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
}

export interface PayrollRun {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  bonus: number;
  grossPay: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
  processedDate?: string;
  paidDate?: string;
  paymentMode?: string;
}
