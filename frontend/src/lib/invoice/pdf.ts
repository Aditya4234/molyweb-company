import jsPDF from "jspdf";
import type { InvoiceFormData, CompanyInfo } from "@/types/invoice";
import { calculateInvoiceTotals } from "./gst";

const FONTS = {
  bold: "helvetica",
  normal: "helvetica",
};

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

function formatCurrency(value: number, currency: string) {
  if (currency === "INR") return `₹${value.toFixed(2)}`;
  return `${currency} ${value.toFixed(2)}`;
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertLessThan1000 = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + convertLessThan1000(n % 100) : ""}`;
  };

  const units = ["", "Thousand", "Lakh", "Crore"];
  const divisors = [1, 1000, 100000, 10000000];
  let result = "";
  let remainder = num;

  for (let i = units.length - 1; i >= 0; i--) {
    const divisor = divisors[i];
    if (remainder >= divisor) {
      const part = Math.floor(remainder / divisor);
      result += `${convertLessThan1000(part)} ${units[i]} `;
      remainder %= divisor;
    }
  }

  return result.trim();
}

export function invoiceToFormData(invoice: { id: string; clientName: string; email: string; amount: number; dueDate: string }): InvoiceFormData {
  return {
    client: {
      name: invoice.clientName,
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      phone: "",
      email: invoice.email,
    },
    items: [
      { id: "1", name: "Services", hsnSac: "", quantity: 1, unitPrice: invoice.amount, gstRate: 18, total: invoice.amount },
    ],
    invoiceNumber: invoice.id,
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: invoice.dueDate,
    discount: 0,
    discountType: "percentage",
    currency: "INR",
    notes: "",
    terms: "",
    gstType: "cgst_sgst",
    subject: "",
    placeOfSupply: "",
    project: "",
    paidAmount: 0,
  };
}

export async function generateInvoicePDF(
  formData: InvoiceFormData,
  logoBase64?: string,
): Promise<Blob> {
  const totals = calculateInvoiceTotals(
    formData.items,
    formData.discount,
    formData.discountType,
    formData.gstType,
  );

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = 210;
  const pageHeight = 297;
  let y = 20;

  const primary: [number, number, number] = [11, 60, 145];
  const grayText: [number, number, number] = [75, 85, 99];
  const darkText: [number, number, number] = [15, 23, 42];
  const grayBorder: [number, number, number] = [224, 226, 228];
  const lightBackground: [number, number, number] = [248, 249, 251];

  const leftColX = logoBase64 ? 50 : 15;
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 15, y - 5, 30, 30);
  }

  doc.setFont(FONTS.bold);
  doc.setFontSize(16);
  doc.setTextColor(...darkText);
  doc.text(COMPANY.name, leftColX, y);

  doc.setFont(FONTS.normal);
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text(COMPANY.address, leftColX, y + 7);
  doc.text(`${COMPANY.city}, ${COMPANY.state} ${COMPANY.pincode}`, leftColX, y + 12);
  doc.text(`GSTIN: ${COMPANY.gstin}`, leftColX, y + 17);
  doc.text(`PAN: ${COMPANY.pan}`, leftColX, y + 22);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, leftColX, y + 27);
  if (COMPANY.website) {
    doc.text(COMPANY.website, leftColX, y + 32);
  }

  doc.setFont(FONTS.bold);
  doc.setFontSize(24);
  doc.setTextColor(...darkText);
  doc.text("TAX INVOICE", pageWidth - 15, y, { align: "right" });

  doc.setFont(FONTS.normal);
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text(`Place Of Supply : ${formData.placeOfSupply || COMPANY.state}`, pageWidth - 15, y + 8, { align: "right" });

  y += 38;

  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.4);
  doc.rect(15, y, 180, 32, "S");
  doc.setFillColor(...lightBackground);
  doc.rect(15, y, 180, 10, "F");
  doc.setFont(FONTS.bold);
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  doc.text("Invoice Details", 18, y + 7);

  const metaLeftX = 18;
  const metaRightX = 110;
  const metaStartY = y + 15;

  doc.setFont(FONTS.normal);
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text("Invoice Date", metaLeftX, metaStartY);
  doc.text("Due Date", metaLeftX, metaStartY + 7);
  doc.text("GST Type", metaRightX, metaStartY);
  doc.text("Currency", metaRightX, metaStartY + 7);

  doc.setFont(FONTS.bold);
  doc.setTextColor(...darkText);
  doc.text(formData.issueDate, metaLeftX, metaStartY + 4);
  doc.text(formData.dueDate, metaLeftX, metaStartY + 11);
  doc.text(formData.gstType === "cgst_sgst" ? "CGST + SGST" : "IGST", metaRightX, metaStartY + 4);
  doc.text(formData.currency, metaRightX, metaStartY + 11);

  y += 44;

  doc.setDrawColor(...grayBorder);
  doc.rect(15, y, 180, 52, "S");
  doc.setFillColor(...lightBackground);
  doc.rect(15, y, 180, 10, "F");
  doc.setFillColor(...primary);
  doc.rect(15, y, 4, 52, "F");

  doc.setFont(FONTS.bold);
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text("Bill To", 20, y + 7);

  doc.setFont(FONTS.normal);
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text(formData.client.name || "-", 20, y + 16);

  const customerLines = [
    formData.client.address,
    `${formData.client.city}, ${formData.client.state} - ${formData.client.pincode}`,
  ].filter(Boolean);
  let lineY2 = y + 21;
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  customerLines.forEach((line) => {
    doc.text(line, 20, lineY2);
    lineY2 += 4.5;
  });
  if (formData.client.gstin) {
    doc.text(`GSTIN: ${formData.client.gstin}`, 20, lineY2);
    lineY2 += 4.5;
  }
  doc.text(`Phone: ${formData.client.phone}`, 20, lineY2);
  lineY2 += 4.5;
  doc.text(`Email: ${formData.client.email}`, 20, lineY2);

  doc.setFont(FONTS.bold);
  doc.setTextColor(...primary);
  doc.text("Subject :", 110, y + 16);
  doc.setFont(FONTS.normal);
  doc.setTextColor(...darkText);
  doc.text(formData.subject || "-", 110, y + 20);

  y += 66;

  const tableX = 15;
  const columnWidths = [10, 60, 16, 14, 20, 14, 18, 14, 18, 15];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  doc.setFillColor(...lightBackground);
  doc.rect(tableX, y, tableWidth, 10, "F");
  doc.setDrawColor(...grayBorder);
  doc.line(tableX, y, tableX + tableWidth, y);
  doc.line(tableX, y + 10, tableX + tableWidth, y + 10);

  const headers = ["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "CGST%", "Amt", "SGST%", "Amt", "Amount"];
  let headerX = tableX;
  headers.forEach((label, index) => {
    const width = columnWidths[index];
    const align = index >= 3 ? "right" : "left";
    doc.setFont(FONTS.bold);
    doc.setFontSize(7);
    doc.setTextColor(...darkText);
    doc.text(label, align === "right" ? headerX + width - 1 : headerX + 1, y + 7, { align });
    headerX += width;
  });

  y += 14;
  doc.setFont(FONTS.normal);
  doc.setFontSize(8);

  formData.items.forEach((item, index) => {
    if (y + 12 > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    const taxableAmount = item.quantity * item.unitPrice;
    const gstAmount = (taxableAmount * item.gstRate) / 100;
    const cgstAmount = formData.gstType === "cgst_sgst" ? gstAmount / 2 : 0;
    const sgstAmount = formData.gstType === "cgst_sgst" ? gstAmount / 2 : 0;
    const igstAmount = formData.gstType === "igst" ? gstAmount : 0;
    const gstAmtDisplay = formData.gstType === "cgst_sgst" ? sgstAmount : igstAmount;

    const rowValues = [
      `${index + 1}`,
      item.name || "-",
      item.hsnSac || "-",
      `${item.quantity}`,
      formatCurrency(item.unitPrice, formData.currency),
      `${item.gstRate}%`,
      formatCurrency(cgstAmount, formData.currency),
      formData.gstType === "cgst_sgst" ? `${item.gstRate}%` : "-",
      formatCurrency(gstAmtDisplay, formData.currency),
      formatCurrency(taxableAmount, formData.currency),
    ];

    let rowX = tableX;
    rowValues.forEach((value, index) => {
      const width = columnWidths[index];
      const align = index >= 3 ? "right" : "left";
      doc.setTextColor(...darkText);
      doc.text(value, align === "right" ? rowX + width - 1 : rowX + 1, y + 6, { align });
      rowX += width;
    });

    doc.setDrawColor(...grayBorder);
    doc.line(tableX, y + 10, tableX + tableWidth, y + 10);
    y += 12;
  });

  y += 4;
  const totalsX = tableX + tableWidth - 82;
  const totalsValueX = tableX + tableWidth - 2;
  const balance = Math.max(totals.grandTotal - formData.paidAmount, 0);
  const summaryRows = [
    ["Sub Total", formatCurrency(totals.subtotal, formData.currency)],
    ["CGST", formatCurrency(totals.gstBreakdown.cgst.amount, formData.currency)],
    ["SGST", formatCurrency(totals.gstBreakdown.sgst.amount, formData.currency)],
    ["Total", formatCurrency(totals.grandTotal, formData.currency)],
    ["Payment Made", `- ${formatCurrency(formData.paidAmount, formData.currency)}`],
    ["Balance Due", formatCurrency(balance, formData.currency)],
  ];

  summaryRows.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setFont(FONTS.normal);
    doc.setTextColor(...grayText);
    doc.text(label, totalsX, y);
    doc.setFont(FONTS.bold);
    doc.setTextColor(...darkText);
    doc.text(value, totalsValueX, y, { align: "right" });
    y += 6.5;
  });

  y += 6;
  doc.setFont(FONTS.bold);
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  doc.text("Total In Words", tableX, y);
  doc.setFont(FONTS.normal);
  doc.setTextColor(...grayText);
  doc.text(`${numberToWords(Math.round(totals.grandTotal))} Only`, tableX, y + 5);

  y += 14;

  if (formData.notes) {
    doc.setFontSize(8);
    doc.setFont(FONTS.bold);
    doc.setTextColor(...darkText);
    doc.text("Notes", tableX, y);
    doc.setFont(FONTS.normal);
    doc.setTextColor(...grayText);
    const noteLines = doc.splitTextToSize(formData.notes, 90);
    noteLines.forEach((line: string) => {
      y += 4.5;
      doc.text(line, tableX, y);
    });
    y += 8;
  }

  if (formData.terms) {
    doc.setFontSize(8);
    doc.setFont(FONTS.bold);
    doc.setTextColor(...darkText);
    doc.text("Terms & Conditions", tableX, y);
    doc.setFont(FONTS.normal);
    doc.setTextColor(...grayText);
    const termsLines = doc.splitTextToSize(formData.terms, 90);
    termsLines.forEach((line: string) => {
      y += 4.5;
      doc.text(line, tableX, y);
    });
    y += 8;
  }

  const signatureY = pageHeight - 40;
  doc.setDrawColor(...grayText);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 80, signatureY, pageWidth - 15, signatureY);
  doc.setFont(FONTS.bold);
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  doc.text("Authorized Signature", pageWidth - 47.5, signatureY + 6, { align: "center" });

  return doc.output("blob");
}

export function downloadPDF(pdfBlob: Blob, filename: string) {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPDF(pdfBlob: Blob) {
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
  URL.revokeObjectURL(url);
}

export async function generateReportPDF(
  title: string,
  data: { label: string; revenue: number; expenses?: number; profit?: number }[],
  period: string,
): Promise<Blob> {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = 210;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Period: ${period}`, 15, y + 8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, y + 14);

  y += 24;

  const headers = ["Period", "Revenue", "Expenses", "Profit"];
  const colWidths = [50, 45, 45, 45];
  const tableX = 15;
  const totalWidth = colWidths.reduce((s, w) => s + w, 0);

  doc.setFillColor(248, 249, 251);
  doc.rect(tableX, y, totalWidth, 10, "F");
  doc.setDrawColor(224, 226, 228);
  doc.line(tableX, y, tableX + totalWidth, y);
  doc.line(tableX, y + 10, tableX + totalWidth, y + 10);

  let hx = tableX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  headers.forEach((h, i) => {
    const align = i === 0 ? "left" : "right";
    doc.text(h, align === "right" ? hx + colWidths[i] - 1 : hx + 2, y + 7, { align } as any);
    hx += colWidths[i];
  });

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;

  data.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    totalRevenue += row.revenue;
    totalExpenses += row.expenses ?? 0;
    totalProfit += row.profit ?? 0;

    const vals = [row.label, `$${row.revenue.toLocaleString()}`, row.expenses !== undefined ? `$${row.expenses.toLocaleString()}` : "-", row.profit !== undefined ? `$${row.profit.toLocaleString()}` : "-"];
    let rx = tableX;
    vals.forEach((v, i) => {
      const align = i === 0 ? "left" : "right";
      doc.setTextColor(15, 23, 42);
      doc.text(v, align === "right" ? rx + colWidths[i] - 1 : rx + 2, y + 4, { align } as any);
      rx += colWidths[i];
    });

    doc.setDrawColor(224, 226, 228);
    doc.line(tableX, y + 7, tableX + totalWidth, y + 7);
    y += 10;
  });

  y += 4;
  doc.setDrawColor(75, 85, 99);
  doc.setLineWidth(0.5);
  doc.line(tableX, y, tableX + totalWidth, y);
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const totals = ["Total", `$${totalRevenue.toLocaleString()}`, totalExpenses ? `$${totalExpenses.toLocaleString()}` : "-", totalProfit ? `$${totalProfit.toLocaleString()}` : "-"];
  let tx = tableX;
  totals.forEach((v, i) => {
    const align = i === 0 ? "left" : "right";
    doc.text(v, align === "right" ? tx + colWidths[i] - 1 : tx + 2, y + 4, { align } as any);
    tx += colWidths[i];
  });

  return doc.output("blob");
}
