"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Download, Printer, Eye, ArrowLeft, Save, CheckCircle, Search, ChevronDown } from "lucide-react";
import { generateInvoicePDF, downloadPDF, printPDF } from "@/lib/invoice/pdf";
import { calculateInvoiceTotals } from "@/lib/invoice/gst";
import { Modal } from "@/components/ui/Modal";
import type { InvoiceItem, InvoiceFormData, GstRate } from "@/types/invoice";
import { GST_RATES } from "@/types/invoice";
import Link from "next/link";
import { createInvoice, getAllClients } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultForm: InvoiceFormData = {
  client: {
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    phone: "",
    email: "",
  },
  items: [
    { id: "1", name: "", hsnSac: "", quantity: 1, unitPrice: 0, gstRate: 18, total: 0 },
  ],
  invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  discount: 0,
  discountType: "percentage",
  currency: "INR",
  notes: "Payment is due within 15 days.",
  terms: "1. Goods once sold cannot be returned.\n2. Late payment attracts 2% interest per month.",
  gstType: "cgst_sgst",
  subject: "",
  placeOfSupply: "Uttar Pradesh (09)",
  project: "",
  paidAmount: 0,
};

let itemCounter = 1;

export default function CreateInvoicePage() {
  const [form, setForm] = useState<InvoiceFormData>(defaultForm);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/image/logo.png")
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
    getAllClients().then(setAllClients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#client-search-section")) setClientDropdownOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [clientDropdownOpen]);

  const updateField = <K extends keyof InvoiceFormData>(
    key: K,
    value: InvoiceFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateClient = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      client: { ...prev.client, [field]: value },
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice" || field === "gstRate") {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }),
    }));
  };

  const addItem = () => {
    itemCounter++;
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `${itemCounter}`, name: "", hsnSac: "", quantity: 1, unitPrice: 0, gstRate: 18, total: 0 },
      ],
    }));
  };

  const removeItem = (id: string) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const filteredClients = clientSearch
    ? allClients.filter((c) =>
        (c.name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.company || "").toLowerCase().includes(clientSearch.toLowerCase())
      )
    : allClients;

  const selectClient = (c: any) => {
    const addrParts = (c.address || "").split(",").map((s: string) => s.trim());
    const city = addrParts.length > 1 ? addrParts[addrParts.length - 2] : "";
    const state = addrParts.length > 1 ? addrParts[addrParts.length - 1] : "";
    setForm((prev) => ({
      ...prev,
      client: {
        name: c.name || "",
        address: c.address || "",
        city,
        state,
        pincode: c.pincode || "",
        gstin: c.gstin || "",
        phone: c.phone || "",
        email: c.email || "",
      },
    }));
    setClientSearch(c.name || "");
    setClientDropdownOpen(false);
  };

  const totals = calculateInvoiceTotals(
    form.items,
    form.discount,
    form.discountType,
    form.gstType,
  );

  const handleGeneratePDF = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateInvoicePDF(form, logoBase64);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setGenerating(false);
    }
  }, [form, logoBase64]);

  const handleDownload = useCallback(async () => {
    const blob = await generateInvoicePDF(form, logoBase64);
    downloadPDF(blob, `${form.invoiceNumber}.pdf`);
  }, [form, logoBase64]);

  const handlePrint = useCallback(async () => {
    const blob = await generateInvoicePDF(form, logoBase64);
    printPDF(blob);
  }, [form, logoBase64]);

  const handleSaveDraft = useCallback(async () => {
    try {
      const created = await createInvoice({
        clientName: form.client.name,
        email: form.client.email,
        clientAddress: form.client.address,
        clientCity: form.client.city,
        clientState: form.client.state,
        amount: totals.grandTotal || 0,
        paidAmount: form.paidAmount,
        dueDate: form.dueDate,
        status: "draft",
        invoiceDate: form.issueDate,
        items: form.items.map((item) => ({
          description: item.name || item.hsnSac || "Services",
          quantity: item.quantity,
          rate: item.unitPrice,
          amount: item.total,
        })),
        notes: form.notes,
      });
      setSaved(true);
      setTimeout(() => window.location.href = `/admin/invoices/${created.id || created._id}`, 1500);
    } catch (err) {
      console.error("Failed to save draft", err);
      alert("Failed to save draft. Please check all required fields and try again.");
    }
  }, [form, totals]);

  if (saved) {
    return (
      <div className="p-4 lg:p-8 min-w-0 flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Draft Saved!</h2>
          <p className="mt-1 text-sm text-gray-500">Redirecting to invoices...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/invoices"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below to generate a professional GST invoice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Eye size={16} />
            {generating ? "Generating..." : "Preview PDF"}
          </button>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Client Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Client Search / Auto-fill */}
              <div id="client-search-section" className="relative sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Search Client <span className="text-gray-400 font-normal">(type to search & auto-fill)</span>
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Search by name, email or company..."
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {clientDropdownOpen && clientSearch && filteredClients.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.slice(0, 10).map((c: any) => (
                      <button
                        key={c.id || c.name}
                        type="button"
                        onClick={() => selectClient(c)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 shrink-0">
                          {(c.name || "?").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.email} {c.company ? `· ${c.company}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {[
                { label: "Client Name", field: "name", required: true },
                { label: "Billing Address", field: "address" },
                { label: "City", field: "city" },
                { label: "State", field: "state" },
                { label: "Pincode", field: "pincode" },
                { label: "GSTIN (optional)", field: "gstin" },
                { label: "Phone", field: "phone", required: true },
                { label: "Email", field: "email", type: "email", required: true },
              ].map(({ label, field, type, required }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type || "text"}
                    value={(form.client as any)[field]}
                    onChange={(e) => updateClient(field, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder={label}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Project</label>
                <input
                  type="text"
                  value={form.project}
                  onChange={(e) => updateField("project", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Jama (Amount Paid)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.paidAmount}
                  onChange={(e) => updateField("paidAmount", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Pending (Baaki)</label>
                <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-amber-600">
                  ₹{Math.max(0, totals.grandTotal - form.paidAmount).toFixed(2)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Invoice Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Invoice Details</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Invoice No.</label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => updateField("invoiceNumber", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => updateField("issueDate", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField("dueDate", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Project</label>
                <input
                  type="text"
                  value={form.project}
                  onChange={(e) => updateField("project", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Place Of Supply</label>
                <input
                  type="text"
                  value={form.placeOfSupply}
                  onChange={(e) => updateField("placeOfSupply", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">GST Type</label>
                <select
                  value={form.gstType}
                  onChange={(e) => updateField("gstType", e.target.value as "cgst_sgst" | "igst")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="cgst_sgst">CGST + SGST</option>
                  <option value="igst">IGST</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Items Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="py-2 text-left">Item & Description</th>
                    <th className="py-2 text-left">HSN/SAC</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">GST%</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-center w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {form.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
                          placeholder="Item / Description"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={item.hsnSac || ""}
                          onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-blue-300"
                          placeholder="HSN"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 rounded-lg border border-gray-200 px-2 py-2 text-right text-sm outline-none focus:border-blue-300"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-24 rounded-lg border border-gray-200 px-2 py-2 text-right text-sm outline-none focus:border-blue-300"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(item.id, "gstRate", parseInt(e.target.value))}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-blue-300"
                        >
                          {GST_RATES.map((rate) => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-1 text-right text-sm font-medium text-gray-900">
                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Notes & Terms */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Terms & Conditions</label>
                <textarea
                  value={form.terms}
                  onChange={(e) => updateField("terms", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Invoice Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-red-500">-₹{totals.discountAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                {form.gstType === "cgst_sgst" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CGST @ {totals.gstBreakdown.cgst.rate}%</span>
                      <span className="font-medium text-gray-900">₹{totals.gstBreakdown.cgst.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">SGST @ {totals.gstBreakdown.sgst.rate}%</span>
                      <span className="font-medium text-gray-900">₹{totals.gstBreakdown.sgst.amount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IGST @ {totals.gstBreakdown.igst.rate}%</span>
                    <span className="font-medium text-gray-900">₹{totals.gstBreakdown.igst.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <label className="text-xs font-medium text-gray-600">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount}
                  onChange={(e) => updateField("discount", parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm outline-none focus:border-blue-300"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Jama (Paid)</span>
                <span className="font-medium text-emerald-600">₹{form.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-500">Pending (Baaki)</span>
                <span className="font-medium text-amber-600">₹{Math.max(0, totals.grandTotal - form.paidAmount).toFixed(2)}</span>
              </div>

              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <p className="text-xs text-blue-200">Grand Total</p>
                <p className="mt-1 text-2xl font-bold">₹{totals.grandTotal.toFixed(2)}</p>
                <p className="mt-1 text-xs text-blue-200">
                  Taxable Value: ₹{totals.taxableValue.toFixed(2)} | GST: ₹{totals.gstBreakdown.totalGst.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Discount & Currency */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Save size={16} />
            Save as Draft
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Invoice Preview" size="full">
        {pdfUrl && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Preview of {form.invoiceNumber}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Printer size={16} /> Print
                </button>
              </div>
            </div>
            <iframe
              src={pdfUrl}
              className="h-[80vh] w-full rounded-xl border border-gray-200"
              title="Invoice Preview"
            />
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
