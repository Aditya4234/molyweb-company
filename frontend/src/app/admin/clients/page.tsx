"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Mail, Phone, MapPin, Building2, Users,
  MoreHorizontal, ChevronLeft, ChevronRight, Download, Trash2, Edit,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getAllClients, createClient, updateClient, deleteClient } from "@/lib/api";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  state: string;
  gstin: string;
  totalInvoices: number;
  totalAmount: number;
  status: "active" | "inactive";
  createdAt: string;
}

function backendToClient(b: any): Client {
  const addrParts = (b.address || "").split(",").map((s: string) => s.trim());
  return {
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone || "",
    company: b.company || "",
    city: addrParts.length > 1 ? addrParts[addrParts.length - 2] : addrParts[0] || "",
    state: addrParts.length > 1 ? addrParts[addrParts.length - 1] : "",
    gstin: b.gstin || "",
    totalInvoices: b.totalInvoices,
    totalAmount: b.totalAmount,
    status: b.status,
    createdAt: b.createdAt ? b.createdAt.split("T")[0] : "",
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "", city: "", state: "", gstin: "" });
  const ITEMS_PER_PAGE = 6;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleAddClient = async () => {
    try {
      const address = [newClient.city, newClient.state].filter(Boolean).join(", ");
      const created = await createClient({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company,
        address,
        gstin: newClient.gstin,
      });
      setClients((prev) => [backendToClient(created), ...prev]);
      setShowAdd(false);
      setNewClient({ name: "", email: "", phone: "", company: "", city: "", state: "", gstin: "" });
      showToast("Client added successfully");
    } catch {
      showToast("Failed to add client");
    }
  };

  useEffect(() => {
    getAllClients()
      .then((res) => setClients(res.map(backendToClient)))
      .catch(() => showToast("Failed to load clients"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...clients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your client base and their details</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} /> Add Client
        </button>
      </motion.div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        {[
          { label: "Total Clients", value: String(clients.length), change: "+3 this month", icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active", value: String(clients.filter((c) => c.status === "active").length), change: `${Math.round(clients.filter(c => c.status === "active").length / clients.length * 100)}% rate`, icon: Building2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Revenue", value: `$${(clients.reduce((s, c) => s + c.totalAmount, 0) / 1000).toFixed(0)}K`, change: "from all clients", icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Avg Invoices", value: String(Math.round(clients.reduce((s, c) => s + c.totalInvoices, 0) / clients.length)), change: "per client", icon: Building2, color: "text-amber-600 bg-amber-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}>
              <stat.icon size={20} />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 lg:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, company, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap",
                statusFilter === s
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Client", "Contact", "GSTIN", "Invoices", "Revenue", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3.5 last:pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((client, i) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition hover:bg-blue-50/30 cursor-pointer"
                  onClick={() => setSelectedClient(client)}>
                  <td className="px-4 py-4 first:pl-6">
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.company}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{client.email}</p>
                    <p className="text-xs text-gray-400">{client.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-gray-500">{client.gstin}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900">{client.totalInvoices}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">${client.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={client.status === "active" ? "success" : "default"}>
                      {client.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 last:pr-6">
                    <button onClick={() => setSelectedClient(client)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">No clients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition",
                    page === i + 1 ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <Modal open={!!selectedClient} onClose={() => setSelectedClient(null)} title="Client Details" size="lg">
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedClient.name}</h3>
                <p className="text-sm text-gray-500">{selectedClient.company}</p>
              </div>
              <Badge variant={selectedClient.status === "active" ? "success" : "default"}>
                {selectedClient.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900 ml-1">{selectedClient.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900 ml-1">{selectedClient.phone}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="text-gray-900 ml-1">{selectedClient.city}, {selectedClient.state}</span></div>
              <div><span className="text-gray-500">GSTIN:</span> <span className="text-gray-900 ml-1">{selectedClient.gstin}</span></div>
              <div><span className="text-gray-500">Total Invoices:</span> <span className="text-gray-900 ml-1">{selectedClient.totalInvoices}</span></div>
              <div><span className="text-gray-500">Total Revenue:</span> <span className="text-gray-900 ml-1 font-semibold">${selectedClient.totalAmount.toLocaleString()}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setEditClient(selectedClient); setSelectedClient(null); }} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"><Edit size={16} /> Edit</button>
              <button onClick={async () => {
                if (!confirm("Delete this client?")) return;
                try {
                  await deleteClient(selectedClient.id);
                  setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
                  setSelectedClient(null);
                  showToast("Client deleted");
                } catch { showToast("Failed to delete client"); }
              }} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Client" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Client Name", key: "name", type: "text", required: true },
            { label: "Email", key: "email", type: "email", required: true },
            { label: "Phone", key: "phone", type: "tel" },
            { label: "Company", key: "company", type: "text" },
            { label: "City", key: "city", type: "text" },
            { label: "State", key: "state", type: "text" },
            { label: "GSTIN", key: "gstin", type: "text" },
          ].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
              <input
                type={f.type}
                required={f.required}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                value={(newClient as any)[f.key]}
                onChange={(e) => setNewClient((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm placeholder:text-gray-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setShowAdd(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleAddClient} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">Save Client</button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}
