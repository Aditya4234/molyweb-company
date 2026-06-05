"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CompanyInfo } from "@/types/invoice";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import type { TableItem } from "@/components/invoice/InvoiceTable";
import { InvoiceSummary } from "@/components/invoice/InvoiceSummary";
import { InvoiceNotes } from "@/components/invoice/InvoiceNotes";
import { SignatureSection } from "@/components/invoice/SignatureSection";
import { getInvoice } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const COMPANY: CompanyInfo = {
  name: "Molyweb Digital Solutions Private Limited",
  address: "Flat No. 102, Om Plaza Apartment, Sector-19, Indira Nagar",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226016",
  gstin: "09AAACM5601QZM",
  pan: "AAACM5601Q",
  phone: "9453354551",
  email: "sales@molyweb.com",
  website: "www.molyweb.com",
};

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  terms: string;
  placeOfSupply: string;
  customer: { name: string; address: string; city: string; state: string; country: string };
  subject: string;
  items: TableItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  notes: string;
  termsConditions: string;
  status: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getInvoice(id)
      .then((res: any) => {
        const items: TableItem[] = (res.items || []).map((item: any, idx: number) => {
          const taxableValue = item.quantity * item.rate;
          const cgstAmt = taxableValue * 0.09;
          const sgstAmt = taxableValue * 0.09;
          return {
            id: idx + 1,
            description: item.description || "Services",
            hsnSac: item.hsnSac || "9983",
            quantity: item.quantity,
            rate: item.rate,
            cgst: { rate: 9, amount: cgstAmt },
            sgst: { rate: 9, amount: sgstAmt },
            amount: taxableValue + cgstAmt + sgstAmt,
          };
        });

        const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
        const cgstTotal = items.reduce((s, i) => s + i.cgst.amount, 0);
        const sgstTotal = items.reduce((s, i) => s + i.sgst.amount, 0);
        const grandTotal = subtotal + cgstTotal + sgstTotal;

        setInvoice({
          id: res.id,
          number: res.id || `INV-${Date.now()}`,
          date: res.invoiceDate || res.createdAt,
          dueDate: res.dueDate,
          terms: "Net 15",
          placeOfSupply: "Uttar Pradesh (09)",
          customer: {
            name: res.clientName || "",
            address: res.clientAddress || "",
            city: res.clientCity || "",
            state: res.clientState || "",
            country: "India",
          },
          subject: "Digital Services",
          items,
          subtotal,
          cgstTotal,
          sgstTotal,
          grandTotal,
          paidAmount: res.paidAmount || 0,
          balanceDue: grandTotal - (res.paidAmount || 0),
          notes: res.notes || "Payment is due within 15 days from the date of invoice.",
          termsConditions:
            "1. Services will commence after receipt of advance payment.\n" +
            "2. Late payment attracts 2% interest per month on outstanding amount.\n" +
            "3. All disputes subject to Lucknow jurisdiction.\n" +
            "4. Support included for 30 days post-delivery.",
          status: res.status || "draft",
        });
      })
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const element = printRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${invoice?.number || Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Invoice not found</p>
          <Link href="/admin/invoices" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > :not(.print-area) { display: none !important; }
          .print-area { position: static !important; visibility: visible !important; width: 100% !important; box-shadow: none !important; margin: 0 auto !important; padding: 15mm 20mm !important; }
          .print-area * { visibility: visible !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[210mm] mx-auto overflow-x-auto">
          <div className="mb-4 no-print flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft size={16} />
              Back to Invoices
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              ><Printer size={15} /> Print</button>
              <button onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              ><Download size={15} /> Download PDF</button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="print:hidden bg-white shadow-lg mx-auto w-full max-sm:!w-full max-sm:!min-h-0 max-sm:!p-4"
            style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm" }}
          >
            <InvoiceContent invoice={invoice} />
          </motion.div>

          <div ref={printRef}
            className="print-area hidden print:block bg-white mx-auto w-full"
            style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm" }}
          >
            <InvoiceContent invoice={invoice} />
          </div>
        </div>
      </div>
    </>
  );
}

function InvoiceContent({ invoice }: { invoice: InvoiceData }) {
  return (
    <>
      <InvoiceHeader company={COMPANY} invoiceNumber={invoice.number} />

      <div className="grid grid-cols-2 gap-6 mb-5">
        <div className="border border-gray-300 rounded-sm p-3">
          <h3 className="text-xs font-semibold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">Invoice Details</h3>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Number</span>
              <span className="font-medium text-gray-900">{invoice.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Date</span>
              <span className="font-medium text-gray-900">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Terms</span>
              <span className="font-medium text-gray-900">{invoice.terms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date</span>
              <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>
        <div className="border border-gray-300 rounded-sm p-3">
          <h3 className="text-xs font-semibold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">Place Of Supply</h3>
          <p className="text-[11px] font-medium text-gray-900 mt-2">{invoice.placeOfSupply}</p>
        </div>
      </div>

      <div className="border border-gray-300 rounded-sm p-3 mb-5">
        <h3 className="text-xs font-semibold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">Bill To</h3>
        <p className="text-sm font-semibold text-gray-900">{invoice.customer.name}</p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {invoice.customer.address}{invoice.customer.address && ", "}{invoice.customer.city}, {invoice.customer.state} - India
        </p>
      </div>

      <div className="border border-gray-300 rounded-sm p-3 mb-5">
        <h3 className="text-xs font-semibold text-gray-800 mb-1">Subject</h3>
        <p className="text-[11px] font-medium text-gray-900">{invoice.subject}</p>
      </div>

      <div className="mb-5">
        <InvoiceTable items={invoice.items} />
      </div>

      <div className="mb-5">
        <InvoiceSummary
          subtotal={invoice.subtotal}
          cgstTotal={invoice.cgstTotal}
          sgstTotal={invoice.sgstTotal}
          grandTotal={invoice.grandTotal}
          paidAmount={invoice.paidAmount}
          balanceDue={invoice.balanceDue}
        />
      </div>

      <div className="mb-4">
        <InvoiceNotes notes={invoice.notes} termsConditions={invoice.termsConditions} />
      </div>

      <SignatureSection />
    </>
  );
}
