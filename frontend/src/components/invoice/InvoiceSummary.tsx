interface Props {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
}

export function InvoiceSummary({ subtotal, cgstTotal, sgstTotal, grandTotal, paidAmount, balanceDue }: Props) {
  const rows = [
    { label: "Sub Total", value: subtotal, bold: false, isRed: false },
    { label: "CGST9 (9%)", value: cgstTotal, bold: false, isRed: false },
    { label: "SGST9 (9%)", value: sgstTotal, bold: false, isRed: false },
    { label: "Total", value: grandTotal, bold: true, isRed: false },
    { label: "Payment Made", value: paidAmount, bold: false, isRed: true },
    { label: "Balance Due", value: balanceDue, bold: true, isRed: false },
  ];

  return (
    <div className="w-full">
      <table className="w-full text-[11px]">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={`px-2 py-1 text-right ${row.bold ? "font-bold text-gray-900" : "text-gray-700"}`}>
                {row.label}
              </td>
              <td className={`px-2 py-1 text-right w-24 ${row.bold ? "font-bold" : ""} ${row.isRed ? "text-red-600" : "text-gray-900"}`}>
                {row.isRed ? `(-) ` : ""}{row.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
