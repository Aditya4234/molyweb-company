"use client";

export interface TableItem {
  id: number;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  cgst: { rate: number; amount: number };
  sgst: { rate: number; amount: number };
  amount: number;
}

interface Props {
  items: TableItem[];
}

export function InvoiceTable({ items }: Props) {
  return (
    <div className="w-full">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-gray-100/50">
            <th className="px-2 py-1.5 text-center font-bold border-r border-gray-400 border-b border-gray-400 w-8" rowSpan={2}>#</th>
            <th className="px-2 py-1.5 text-left font-bold border-r border-gray-400 border-b border-gray-400" rowSpan={2}>Item & Description</th>
            <th className="px-2 py-1.5 text-left font-bold border-r border-gray-400 border-b border-gray-400 w-16" rowSpan={2}>HSN<br/>/SAC</th>
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-12" rowSpan={2}>Qty</th>
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-20" rowSpan={2}>Rate</th>
            <th className="px-2 py-1.5 text-center font-bold border-r border-gray-400 border-b border-gray-400" colSpan={2}>CGST</th>
            <th className="px-2 py-1.5 text-center font-bold border-r border-gray-400 border-b border-gray-400" colSpan={2}>SGST</th>
            <th className="px-2 py-1.5 text-right font-bold border-b border-gray-400 w-24" rowSpan={2}>Amount</th>
          </tr>
          <tr className="bg-gray-100/50">
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-10">%</th>
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-16">Amt</th>
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-10">%</th>
            <th className="px-2 py-1.5 text-right font-bold border-r border-gray-400 border-b border-gray-400 w-16">Amt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="px-2 py-2 text-gray-900 text-center border-r border-gray-400 align-top">{idx + 1}</td>
              <td className="px-2 py-2 text-gray-500 font-medium border-r border-gray-400 align-top">{item.description}</td>
              <td className="px-2 py-2 text-gray-900 border-r border-gray-400 align-top">{item.hsnSac}</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{item.quantity.toFixed(2)}</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{item.cgst.rate}%</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{(item.cgst.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{item.sgst.rate}%</td>
              <td className="px-2 py-2 text-gray-900 text-right border-r border-gray-400 align-top">{(item.sgst.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="px-2 py-2 text-gray-900 text-right font-medium align-top">{(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
