export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "draft";
  items?: InvoiceItem[];
  invoiceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  gstin?: string;
  status: "active" | "inactive";
  totalInvoices: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  status: "active" | "inactive" | "on-leave";
  joinDate: string;
  address: string;
  bankAccount?: string;
  ifscCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: "present" | "absent" | "half-day" | "leave" | "holiday";
  checkIn: string;
  checkOut: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "vacation" | "sick" | "personal" | "other";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "paid" | "pending" | "processing";
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: "credit_card" | "bank_transfer" | "cash" | "check" | "upi";
  status: "completed" | "pending" | "failed" | "refunded";
  transactionId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPlan {
  id: string;
  clientId: string;
  clientName: string;
  plan: "basic" | "pro" | "enterprise";
  amount: number;
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
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
  type: "payment" | "invoice" | "client" | "failed" | "refund" | "employee" | "leave" | "payroll";
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
  recentInvoices: Invoice[];
  recentActivity: Activity[];
  monthlyRevenue: MonthlyRevenue[];
  paymentStatus: PaymentStatus[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}
