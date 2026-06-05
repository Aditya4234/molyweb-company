interface Props {
  notes: string;
  termsConditions: string;
  amountInWords?: string;
}

export function InvoiceNotes({ notes, termsConditions, amountInWords }: Props) {
  return (
    <div className="flex flex-col gap-3 text-[10px] text-gray-800 p-2">
      {amountInWords && (
        <div>
          <span className="text-gray-600 block mb-0.5">Total In Words</span>
          <p className="font-bold font-serif italic text-[11px] text-gray-900">{amountInWords}</p>
        </div>
      )}
      <div>
        <span className="text-gray-600 block mb-0.5">Notes</span>
        <p className="leading-tight whitespace-pre-line">{notes}</p>
      </div>
      <div>
        <span className="text-gray-600 block mb-0.5">Terms & Conditions</span>
        <p className="leading-tight whitespace-pre-line">{termsConditions}</p>
      </div>
    </div>
  );
}
