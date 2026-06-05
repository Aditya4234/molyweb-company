const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || "/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("molyweb_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `API error: ${res.status}` }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function mapInvoice(inv: any) {
  return {
    id: String(inv.id || inv._id),
    clientName: inv.clientName,
    email: inv.email,
    amount: inv.amount,
    dueDate: inv.dueDate,
    status: inv.status,
    createdAt: inv.createdAt ? String(inv.createdAt) : new Date().toISOString(),
    items: Array.isArray(inv.items) ? inv.items.length : inv.items ?? 0,
  };
}

export async function getDashboardData() {
  return fetchJSON<any>("/dashboard");
}

export async function getInvoices(search?: string, status?: string, page = 1, limit = 100) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return fetchJSON<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(
    `/invoices?${params}`
  );
}

export async function getAllInvoices() {
  const data = await fetchJSON<any[]>("/invoices/all");
  return data.map(mapInvoice);
}

export async function getInvoice(id: string) {
  return fetchJSON<any>(`/invoices/${id}`);
}

export async function createInvoice(data: any) {
  return fetchJSON<any>("/invoices", { method: "POST", body: JSON.stringify(data) });
}

export async function updateInvoice(id: string, data: any) {
  return fetchJSON<any>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteInvoice(id: string) {
  return fetchJSON<void>(`/invoices/${id}`, { method: "DELETE" });
}

export async function emailInvoice(id: string) {
  return fetchJSON<any>(`/invoices/${id}/email`, { method: "POST" });
}

export async function remindInvoice(id: string) {
  return fetchJSON<any>(`/invoices/${id}/remind`, { method: "POST" });
}

export async function remindAllInvoices() {
  return fetchJSON<any>("/invoices/remind-all", { method: "POST" });
}

export async function exportInvoicesCsv() {
  return fetchJSON<any>(`/invoices/export/csv`);
}

export async function getClients(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return fetchJSON<{ data: any[]; total: number }>(`/clients?${params}`);
}

export async function getAllClients() {
  return fetchJSON<any[]>("/clients/all");
}

export async function getClient(id: string) {
  return fetchJSON<any>(`/clients/${id}`);
}

export async function createClient(data: any) {
  return fetchJSON<any>("/clients", { method: "POST", body: JSON.stringify(data) });
}

export async function updateClient(id: string, data: any) {
  return fetchJSON<any>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteClient(id: string) {
  return fetchJSON<void>(`/clients/${id}`, { method: "DELETE" });
}

export async function getPayments(status?: string, method?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (method) params.set("method", method);
  return fetchJSON<{ data: any[]; total: number }>(`/payments?${params}`);
}

export async function getPayment(id: string) {
  return fetchJSON<any>(`/payments/${id}`);
}

export async function createPayment(data: any) {
  return fetchJSON<any>("/payments", { method: "POST", body: JSON.stringify(data) });
}

export async function updatePayment(id: string, data: any) {
  return fetchJSON<any>(`/payments/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deletePayment(id: string) {
  return fetchJSON<void>(`/payments/${id}`, { method: "DELETE" });
}

export async function getBillingPlans(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  return fetchJSON<{ data: any[]; total: number }>(`/billing?${params}`);
}

export async function getBillingPlan(id: string) {
  return fetchJSON<any>(`/billing/${id}`);
}

export async function createBillingPlan(data: any) {
  return fetchJSON<any>("/billing", { method: "POST", body: JSON.stringify(data) });
}

export async function updateBillingPlan(id: string, data: any) {
  return fetchJSON<any>(`/billing/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteBillingPlan(id: string) {
  return fetchJSON<void>(`/billing/${id}`, { method: "DELETE" });
}

export async function getEmployees(search?: string, department?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (department) params.set("department", department);
  if (status) params.set("status", status);
  return fetchJSON<{ data: any[]; total: number }>(`/employees?${params}`);
}

export async function getAllEmployees() {
  return fetchJSON<any[]>("/employees/all");
}

export async function getEmployee(id: string) {
  return fetchJSON<any>(`/employees/${id}`);
}

export async function createEmployee(data: any) {
  return fetchJSON<any>("/employees", { method: "POST", body: JSON.stringify(data) });
}

export async function updateEmployee(id: string, data: any) {
  return fetchJSON<any>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteEmployee(id: string) {
  return fetchJSON<void>(`/employees/${id}`, { method: "DELETE" });
}

export async function getDepartments(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return fetchJSON<any[]>("/departments?" + params);
}

export async function createDepartment(data: { name: string; head?: string; budget?: number; status?: string }) {
  return fetchJSON<any>("/departments", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDepartment(id: string, data: any) {
  return fetchJSON<any>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteDepartment(id: string) {
  return fetchJSON<void>(`/departments/${id}`, { method: "DELETE" });
}

export async function getAttendance(employeeId?: string, date?: string) {
  const params = new URLSearchParams();
  if (employeeId) params.set("employeeId", employeeId);
  if (date) params.set("date", date);
  return fetchJSON<{ data: any[]; total: number }>(`/attendance?${params}`);
}

export async function markAttendance(data: { employeeId: string; employeeName: string; date: string; status: string; checkIn?: string; checkOut?: string }) {
  return fetchJSON<any>("/attendance", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAttendance(id: string, data: any) {
  return fetchJSON<any>(`/attendance/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getLeaveRequests(status?: string, employeeId?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (employeeId) params.set("employeeId", employeeId);
  return fetchJSON<{ data: any[]; total: number }>(`/leave?${params}`);
}

export async function getLeaveBalances(employeeId?: string) {
  const params = employeeId ? `?employeeId=${employeeId}` : "";
  return fetchJSON<any>(`/leave/balances${params}`);
}

export async function createLeaveRequest(data: { employeeId: string; employeeName: string; type: string; startDate: string; endDate: string; reason: string }) {
  return fetchJSON<any>("/leave", { method: "POST", body: JSON.stringify(data) });
}

export async function updateLeaveRequest(id: string, data: any) {
  return fetchJSON<any>(`/leave/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getPayrollRecords(month?: string, year?: number, status?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (year) params.set("year", String(year));
  if (status) params.set("status", status);
  return fetchJSON<{ data: any[]; total: number }>(`/payroll?${params}`);
}

export async function runPayroll(month: string, year: number) {
  return fetchJSON<any>("/payroll/run", { method: "POST", body: JSON.stringify({ month, year }) });
}

export async function updatePayroll(id: string, data: any) {
  return fetchJSON<any>(`/payroll/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getStats() {
  return fetchJSON<any[]>("/stats");
}

export async function getRevenueReport(period: "monthly" | "quarterly" | "yearly" = "monthly") {
  return fetchJSON<any[]>(`/reports/revenue?period=${period}`);
}

export async function getInvoiceStats() {
  return fetchJSON<any>("/stats/invoices");
}

export async function getClientStats() {
  return fetchJSON<any>("/stats/clients");
}

export async function getPaymentReport() {
  return fetchJSON<any>("/reports/payments");
}

export async function getReportInvoices() {
  return fetchJSON<any>("/reports/invoices");
}

export async function getReportEmployees() {
  return fetchJSON<any>("/reports/employees");
}

export async function getActivities(page = 1, limit = 20) {
  return fetchJSON<{ data: any[]; total: number }>(`/activities?page=${page}&limit=${limit}`);
}

export async function getNotifications() {
  return fetchJSON<any[]>("/activities/notifications");
}

export async function markAllNotificationsRead() {
  return fetchJSON<any>("/activities/notifications/read-all", { method: "POST" });
}

export async function globalSearch(q: string) {
  return fetchJSON<{ invoices: any[]; clients: any[]; employees: any[] }>(`/search?q=${encodeURIComponent(q)}`);
}

export async function getOrganizationSettings() {
  return fetchJSON<any>("/settings/organization");
}

export async function updateOrganizationSettings(data: any) {
  return fetchJSON<any>("/settings/organization", { method: "PUT", body: JSON.stringify(data) });
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Reset failed" }));
    throw new Error(err.error || "Reset failed");
  }
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return fetchJSON<any>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateProfile(data: { name?: string; email?: string }) {
  return fetchJSON<any>("/auth/profile", { method: "PUT", body: JSON.stringify(data) });
}
