import dotenv from "dotenv";
dotenv.config();

import db from "./db";
import User from "./models/User";
import Client from "./models/Client";
import Invoice from "./models/Invoice";
import Employee from "./models/Employee";
import Department from "./models/Department";
import Attendance from "./models/Attendance";
import LeaveRequest from "./models/LeaveRequest";
import Payroll from "./models/Payroll";
import Payment from "./models/Payment";
import BillingPlan from "./models/BillingPlan";
import Activity from "./models/Activity";
import LoginAudit from "./models/LoginAudit";
import { getOrganizationSettings } from "./models/Settings";

const seedData = {
  users: [
    { email: "admin@molyweb.com", password: "password123", fullName: "Admin", role: "SUPER_ADMIN" as const, isActive: true },
    { email: "user@molyweb.com", password: "password123", fullName: "John Manager", role: "ADMIN" as const, isActive: true },
  ],
  clients: [
    { name: "Acme Corp", email: "billing@acme.com", phone: "+1-555-0101", company: "Acme Corporation", address: "123 Business Ave, New York, NY 10001", gstin: "GSTIN123456", status: "active" as const },
    { name: "TechStart Inc", email: "finance@techstart.io", phone: "+1-555-0102", company: "TechStart Inc", address: "456 Innovation Drive, San Francisco, CA 94105", gstin: "GSTIN789012", status: "active" as const },
    { name: "GlobalTrade Ltd", email: "ap@globaltrade.com", phone: "+1-555-0103", company: "GlobalTrade Ltd", address: "789 Commerce St, Chicago, IL 60601", gstin: "GSTIN345678", status: "active" as const },
    { name: "DesignStudio Co", email: "payments@designstudio.co", phone: "+1-555-0104", company: "DesignStudio Co", address: "321 Creative Lane, Austin, TX 78701", status: "active" as const },
    { name: "CloudBase Systems", email: "billing@cloudbase.io", phone: "+1-555-0105", company: "CloudBase Systems", address: "654 Cloud Avenue, Seattle, WA 98101", gstin: "GSTIN901234", status: "active" as const },
    { name: "NexGen Solutions", email: "accounting@nexgen.com", phone: "+1-555-0106", company: "NexGen Solutions", address: "987 Future Rd, Boston, MA 02101", status: "active" as const },
    { name: "Quantum Labs", email: "finance@quantumlab.org", phone: "+1-555-0107", company: "Quantum Labs", address: "147 Science Park, Denver, CO 80201", gstin: "GSTIN567890", status: "active" as const },
    { name: "Apex Digital", email: "invoices@apex.digital", phone: "+1-555-0108", company: "Apex Digital", address: "258 Digital Way, Miami, FL 33101", status: "inactive" as const },
  ],
  departments: [
    { name: "Engineering", head: "Alice Johnson", employeeCount: 12, budget: 500000, status: "active" as const },
    { name: "Design", head: "Bob Smith", employeeCount: 8, budget: 300000, status: "active" as const },
    { name: "Marketing", head: "Carol Williams", employeeCount: 6, budget: 250000, status: "active" as const },
    { name: "Sales", head: "David Brown", employeeCount: 10, budget: 400000, status: "active" as const },
    { name: "Human Resources", head: "Eve Davis", employeeCount: 4, budget: 150000, status: "active" as const },
    { name: "Finance", head: "Frank Miller", employeeCount: 5, budget: 200000, status: "active" as const },
  ],
  employees: [
    { firstName: "Alice", lastName: "Johnson", email: "alice@company.com", phone: "+1-555-1001", department: "Engineering", position: "Engineering Manager", salary: 150000, status: "active" as const, joinDate: "2024-01-15", address: "100 Tech Lane, SF, CA", bankAccount: "****1234", ifscCode: "HDFC0001234" },
    { firstName: "Bob", lastName: "Smith", email: "bob@company.com", phone: "+1-555-1002", department: "Design", position: "Lead Designer", salary: 130000, status: "active" as const, joinDate: "2024-02-01", address: "200 Design St, SF, CA", bankAccount: "****5678", ifscCode: "HDFC0005678" },
    { firstName: "Charlie", lastName: "Brown", email: "charlie@company.com", phone: "+1-555-1003", department: "Engineering", position: "Senior Developer", salary: 125000, status: "active" as const, joinDate: "2024-03-10", address: "300 Code Ave, SF, CA" },
    { firstName: "Diana", lastName: "Prince", email: "diana@company.com", phone: "+1-555-1004", department: "Marketing", position: "Marketing Lead", salary: 110000, status: "active" as const, joinDate: "2024-04-05", address: "400 Market Rd, SF, CA" },
    { firstName: "Edward", lastName: "Norton", email: "edward@company.com", phone: "+1-555-1005", department: "Sales", position: "Sales Manager", salary: 140000, status: "active" as const, joinDate: "2024-01-20", address: "500 Sales Blvd, SF, CA" },
    { firstName: "Fiona", lastName: "Apple", email: "fiona@company.com", phone: "+1-555-1006", department: "Finance", position: "Finance Manager", salary: 135000, status: "active" as const, joinDate: "2024-02-15", address: "600 Money St, SF, CA" },
    { firstName: "George", lastName: "Lucas", email: "george@company.com", phone: "+1-555-1007", department: "Human Resources", position: "HR Manager", salary: 95000, status: "active" as const, joinDate: "2024-03-01", address: "700 People Ave, SF, CA" },
    { firstName: "Hannah", lastName: "Montana", email: "hannah@company.com", phone: "+1-555-1008", department: "Engineering", position: "Developer", salary: 100000, status: "active" as const, joinDate: "2024-05-01", address: "800 Code St, SF, CA" },
    { firstName: "Ian", lastName: "Malcolm", email: "ian@company.com", phone: "+1-555-1009", department: "Design", position: "UI Designer", salary: 90000, status: "on-leave" as const, joinDate: "2024-06-01", address: "900 Design Ln, SF, CA" },
    { firstName: "Julia", lastName: "Roberts", email: "julia@company.com", phone: "+1-555-1010", department: "Marketing", position: "Content Strategist", salary: 85000, status: "active" as const, joinDate: "2024-07-01", address: "1000 Content Dr, SF, CA" },
    { firstName: "Kevin", lastName: "Hart", email: "kevin@company.com", phone: "+1-555-1011", department: "Sales", position: "Sales Rep", salary: 80000, status: "active" as const, joinDate: "2024-08-01", address: "1100 Sales St, SF, CA" },
    { firstName: "Laura", lastName: "Croft", email: "laura@company.com", phone: "+1-555-1012", department: "Engineering", position: "DevOps Engineer", salary: 120000, status: "active" as const, joinDate: "2024-09-01", address: "1200 Ops Way, SF, CA" },
  ],
};

async function seed() {
  try {
    await db.$connect();
    console.log("✓ Connected to PostgreSQL");

    // Clear existing data in reverse order of dependencies
    await Activity.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Activity.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await LoginAudit.find({}).then(async (docs) => {
      for (const doc of docs) {
        await LoginAudit.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Payment.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Payment.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Invoice.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Invoice.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Payroll.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Payroll.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await LeaveRequest.find({}).then(async (docs) => {
      for (const doc of docs) {
        await LeaveRequest.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Attendance.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Attendance.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await BillingPlan.find({}).then(async (docs) => {
      for (const doc of docs) {
        await BillingPlan.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Employee.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Employee.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Client.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Client.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await Department.find({}).then(async (docs) => {
      for (const doc of docs) {
        await Department.findByIdAndDelete(doc.id || doc._id);
      }
    });
    await User.find({}).then(async (docs) => {
      for (const doc of docs) {
        await User.findByIdAndDelete(doc.id || doc._id);
      }
    });
    console.log("✓ Cleared existing data");

    // Seed Users
    for (const u of seedData.users) {
      await User.create(u);
    }
    console.log(`✓ Seeded ${seedData.users.length} users`);

    // Seed Clients
    const createdClients = [];
    for (const client of seedData.clients) {
      const c = await Client.create(client);
      createdClients.push(c);
    }
    console.log(`✓ Seeded ${createdClients.length} clients`);

    // Seed Departments
    const createdDepts = [];
    for (const dept of seedData.departments) {
      const d = await Department.create(dept);
      createdDepts.push(d);
    }
    console.log(`✓ Seeded ${createdDepts.length} departments`);

    // Seed Employees
    const createdEmployees = [];
    for (const emp of seedData.employees) {
      const e = await Employee.create(emp);
      createdEmployees.push(e);
    }
    console.log(`✓ Seeded ${createdEmployees.length} employees`);

    // Seed Invoices
    const invoices = [
      { clientId: String(createdClients[0].id || createdClients[0]._id), clientName: "Acme Corp", email: "billing@acme.com", amount: 12500, paidAmount: 12500, dueDate: "2026-05-15", status: "paid", items: [{ description: "Web Development", quantity: 1, rate: 12500, amount: 12500 }], invoiceDate: "2026-05-01" },
      { clientId: String(createdClients[1].id || createdClients[1]._id), clientName: "TechStart Inc", email: "finance@techstart.io", amount: 8400, paidAmount: 0, dueDate: "2026-05-20", status: "pending", items: [{ description: "UI/UX Design", quantity: 40, rate: 210, amount: 8400 }], invoiceDate: "2026-05-05" },
      { clientId: String(createdClients[2].id || createdClients[2]._id), clientName: "GlobalTrade Ltd", email: "ap@globaltrade.com", amount: 22300, paidAmount: 0, dueDate: "2026-05-10", status: "pending", items: [{ description: "Consulting Services", quantity: 50, rate: 446, amount: 22300 }], invoiceDate: "2026-04-10" },
      { clientId: String(createdClients[3].id || createdClients[3]._id), clientName: "DesignStudio Co", email: "payments@designstudio.co", amount: 5600, paidAmount: 5600, dueDate: "2026-05-25", status: "paid", items: [{ description: "Brand Identity", quantity: 1, rate: 5600, amount: 5600 }], invoiceDate: "2026-05-10" },
      { clientId: String(createdClients[4].id || createdClients[4]._id), clientName: "CloudBase Systems", email: "billing@cloudbase.io", amount: 18900, paidAmount: 0, dueDate: "2026-05-18", status: "pending", items: [{ description: "Cloud Migration", quantity: 1, rate: 18900, amount: 18900 }], invoiceDate: "2026-05-08" },
      { clientId: String(createdClients[5].id || createdClients[5]._id), clientName: "NexGen Solutions", email: "accounting@nexgen.com", amount: 3200, paidAmount: 0, dueDate: "2026-05-30", status: "draft", items: [{ description: "Maintenance", quantity: 1, rate: 3200, amount: 3200 }], invoiceDate: "2026-05-15" },
      { clientId: String(createdClients[6].id || createdClients[6]._id), clientName: "Quantum Labs", email: "finance@quantumlab.org", amount: 15750, paidAmount: 15750, dueDate: "2026-05-12", status: "paid", items: [{ description: "Research Package", quantity: 1, rate: 15750, amount: 15750 }], invoiceDate: "2026-04-28" },
      { clientId: String(createdClients[7].id || createdClients[7]._id), clientName: "Apex Digital", email: "invoices@apex.digital", amount: 9800, paidAmount: 0, dueDate: "2026-05-22", status: "pending", items: [{ description: "Digital Marketing", quantity: 1, rate: 9800, amount: 9800 }], invoiceDate: "2026-04-22" },
      { clientId: String(createdClients[1].id || createdClients[1]._id), clientName: "TechStart Inc", email: "finance@techstart.io", amount: 15000, paidAmount: 0, dueDate: "2026-06-05", status: "draft", items: [{ description: "Mobile App Dev", quantity: 1, rate: 15000, amount: 15000 }], invoiceDate: "2026-05-18" },
      { clientId: String(createdClients[5].id || createdClients[5]._id), clientName: "NexGen Solutions", email: "accounting@nexgen.com", amount: 7200, paidAmount: 0, dueDate: "2026-06-01", status: "pending", items: [{ description: "Server Maintenance", quantity: 3, rate: 2400, amount: 7200 }], invoiceDate: "2026-05-16" },
    ];
    const createdInvoices = [];
    for (const inv of invoices) {
      const i = await Invoice.create(inv);
      createdInvoices.push(i);
    }
    console.log(`✓ Seeded ${createdInvoices.length} invoices`);

    // Update client totals
    for (const client of createdClients) {
      const clientInvoices = createdInvoices.filter((inv) => String(inv.clientId) === String(client.id || client._id));
      const totalAmount = clientInvoices.reduce((s, inv) => s + inv.amount, 0);
      const updated = await Client.findByIdAndUpdate(client.id || client._id, {
        totalInvoices: clientInvoices.length,
        totalAmount,
      });
    }
    console.log(`✓ Updated client invoice totals`);

    // Seed Attendance
    const attendanceRecords = [
      { employeeId: String(createdEmployees[0].id || createdEmployees[0]._id), employeeName: "Alice Johnson", date: "2026-05-01", status: "present", checkIn: "09:00", checkOut: "18:00" },
      { employeeId: String(createdEmployees[1].id || createdEmployees[1]._id), employeeName: "Bob Smith", date: "2026-05-01", status: "present", checkIn: "08:45", checkOut: "17:30" },
      { employeeId: String(createdEmployees[2].id || createdEmployees[2]._id), employeeName: "Charlie Brown", date: "2026-05-01", status: "absent", checkIn: "-", checkOut: "-" },
      { employeeId: String(createdEmployees[3].id || createdEmployees[3]._id), employeeName: "Diana Prince", date: "2026-05-01", status: "present", checkIn: "09:15", checkOut: "18:15" },
      { employeeId: String(createdEmployees[4].id || createdEmployees[4]._id), employeeName: "Edward Norton", date: "2026-05-01", status: "half-day", checkIn: "09:00", checkOut: "13:00" },
      { employeeId: String(createdEmployees[0].id || createdEmployees[0]._id), employeeName: "Alice Johnson", date: "2026-05-02", status: "present", checkIn: "08:55", checkOut: "17:45" },
      { employeeId: String(createdEmployees[1].id || createdEmployees[1]._id), employeeName: "Bob Smith", date: "2026-05-02", status: "leave", checkIn: "-", checkOut: "-" },
      { employeeId: String(createdEmployees[2].id || createdEmployees[2]._id), employeeName: "Charlie Brown", date: "2026-05-02", status: "present", checkIn: "09:10", checkOut: "18:05" },
    ];
    for (const att of attendanceRecords) {
      await Attendance.create(att);
    }
    console.log(`✓ Seeded ${attendanceRecords.length} attendance records`);

    // Seed Leave Requests
    const leaveRequests = [
      { employeeId: String(createdEmployees[1].id || createdEmployees[1]._id), employeeName: "Bob Smith", type: "vacation", startDate: "2026-05-02", endDate: "2026-05-05", reason: "Family vacation", status: "approved" },
      { employeeId: String(createdEmployees[8].id || createdEmployees[8]._id), employeeName: "Ian Malcolm", type: "sick", startDate: "2026-05-10", endDate: "2026-05-14", reason: "Medical leave", status: "approved" },
      { employeeId: String(createdEmployees[7].id || createdEmployees[7]._id), employeeName: "Hannah Montana", type: "personal", startDate: "2026-05-20", endDate: "2026-05-20", reason: "Personal work", status: "pending" },
      { employeeId: String(createdEmployees[10].id || createdEmployees[10]._id), employeeName: "Kevin Hart", type: "vacation", startDate: "2026-06-01", endDate: "2026-06-05", reason: "Summer trip", status: "pending" },
      { employeeId: String(createdEmployees[3].id || createdEmployees[3]._id), employeeName: "Diana Prince", type: "sick", startDate: "2026-05-15", endDate: "2026-05-16", reason: "Not feeling well", status: "approved" },
    ];
    for (const leave of leaveRequests) {
      await LeaveRequest.create(leave);
    }
    console.log(`✓ Seeded ${leaveRequests.length} leave requests`);

    // Seed Payroll
    const payrollRecords = [
      { employeeId: String(createdEmployees[0].id || createdEmployees[0]._id), employeeName: "Alice Johnson", month: "May", year: 2026, basicSalary: 150000, allowances: 20000, deductions: 15000, netSalary: 155000, status: "pending" },
      { employeeId: String(createdEmployees[1].id || createdEmployees[1]._id), employeeName: "Bob Smith", month: "May", year: 2026, basicSalary: 130000, allowances: 15000, deductions: 12000, netSalary: 133000, status: "paid", paidDate: "2026-05-01" },
      { employeeId: String(createdEmployees[2].id || createdEmployees[2]._id), employeeName: "Charlie Brown", month: "May", year: 2026, basicSalary: 125000, allowances: 10000, deductions: 11000, netSalary: 124000, status: "pending" },
      { employeeId: String(createdEmployees[3].id || createdEmployees[3]._id), employeeName: "Diana Prince", month: "May", year: 2026, basicSalary: 110000, allowances: 12000, deductions: 10000, netSalary: 112000, status: "pending" },
      { employeeId: String(createdEmployees[4].id || createdEmployees[4]._id), employeeName: "Edward Norton", month: "May", year: 2026, basicSalary: 140000, allowances: 18000, deductions: 13000, netSalary: 145000, status: "paid", paidDate: "2026-04-30" },
    ];
    for (const pr of payrollRecords) {
      await Payroll.create(pr);
    }
    console.log(`✓ Seeded ${payrollRecords.length} payroll records`);

    // Seed Payments
    const payments = [
      { invoiceId: "INV-001", clientName: "Acme Corp", amount: 12500, method: "bank_transfer", status: "completed", transactionId: "TXN-001", date: "2026-05-02" },
      { invoiceId: "INV-004", clientName: "DesignStudio Co", amount: 5600, method: "credit_card", status: "completed", transactionId: "TXN-002", date: "2026-05-12" },
      { invoiceId: "INV-007", clientName: "Quantum Labs", amount: 15750, method: "bank_transfer", status: "completed", transactionId: "TXN-003", date: "2026-05-11" },
      { invoiceId: "INV-002", clientName: "TechStart Inc", amount: 8400, method: "check", status: "pending", transactionId: "TXN-004", date: "2026-05-15" },
      { invoiceId: "INV-003", clientName: "GlobalTrade Ltd", amount: 22300, method: "bank_transfer", status: "failed", transactionId: "TXN-005", date: "2026-05-10" },
      { invoiceId: "INV-005", clientName: "CloudBase Systems", amount: 18900, method: "upi", status: "pending", transactionId: "TXN-006", date: "2026-05-16" },
    ];
    for (const pmt of payments) {
      await Payment.create(pmt);
    }
    console.log(`✓ Seeded ${payments.length} payments`);

    // Seed Billing Plans
    const billingPlans = [
      { clientId: String(createdClients[0].id || createdClients[0]._id), clientName: "Acme Corp", plan: "enterprise", amount: 2999, status: "active", startDate: "2025-01-15", endDate: "2026-01-15" },
      { clientId: String(createdClients[1].id || createdClients[1]._id), clientName: "TechStart Inc", plan: "pro", amount: 1499, status: "active", startDate: "2025-02-20", endDate: "2026-02-20" },
      { clientId: String(createdClients[2].id || createdClients[2]._id), clientName: "GlobalTrade Ltd", plan: "enterprise", amount: 2999, status: "active", startDate: "2025-03-10", endDate: "2026-03-10" },
      { clientId: String(createdClients[3].id || createdClients[3]._id), clientName: "DesignStudio Co", plan: "basic", amount: 499, status: "trial", startDate: "2025-04-05", endDate: "2025-05-05" },
      { clientId: String(createdClients[4].id || createdClients[4]._id), clientName: "CloudBase Systems", plan: "pro", amount: 1499, status: "active", startDate: "2025-01-25", endDate: "2026-01-25" },
      { clientId: String(createdClients[5].id || createdClients[5]._id), clientName: "NexGen Solutions", plan: "basic", amount: 499, status: "expired", startDate: "2025-05-12", endDate: "2025-11-12" },
    ];
    for (const bp of billingPlans) {
      await BillingPlan.create(bp);
    }
    console.log(`✓ Seeded ${billingPlans.length} billing plans`);

    // Seed Activities
    const activities = [
      { type: "payment", message: "Payment received from Acme Corp - $12,500", timestamp: "Just now", read: false },
      { type: "invoice", message: "Invoice INV-005 sent to CloudBase Systems", timestamp: "2 hours ago", read: false },
      { type: "client", message: "New client registered: DesignStudio Co", timestamp: "1 day ago", read: true },
      { type: "failed", message: "Payment failed for GlobalTrade Ltd - $22,300", timestamp: "2 days ago", read: true },
      { type: "payment", message: "Payment received from Quantum Labs - $15,750", timestamp: "3 days ago", read: true },
      { type: "invoice", message: "Invoice INV-007 marked as paid", timestamp: "4 days ago", read: true },
      { type: "client", message: "New client registered: Apex Digital", timestamp: "1 week ago", read: true },
      { type: "refund", message: "Refund processed for TechStart Inc - $840", timestamp: "1 week ago", read: true },
      { type: "employee", message: "New employee joined: Sarah Chen (Engineering)", timestamp: "2 weeks ago", read: true },
      { type: "leave", message: "Leave approved for Michael Torres (Vacation)", timestamp: "2 weeks ago", read: true },
    ];
    for (const act of activities) {
      await Activity.create(act);
    }
    console.log(`✓ Seeded ${activities.length} activities`);

    await getOrganizationSettings();
    console.log("✓ Seeded organization settings");

    await db.$disconnect();
    console.log("\n✅ Seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
