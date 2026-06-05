import type { CompanyInfo } from "@/types/invoice";
import Image from "next/image";

interface Props {
  company: CompanyInfo;
  invoiceNumber?: string;
}

export function InvoiceHeader({ company, invoiceNumber }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between pb-2 border-b border-gray-400">
      <div className="flex gap-6">
        <div className="shrink-0 pt-1">
          <Image src="/image/logo.png" alt="Logo" width={140} height={80} className="object-contain h-24 w-auto" />
        </div>
        <div className="pt-2">
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight mb-1 font-serif">{company.name}</h1>
          <div className="text-[10px] text-gray-800 leading-tight font-serif">
            <p>{company.address}</p>
            <p>{company.city} {company.state} {company.pincode}</p>
            <p>India</p>
            <p>GSTIN {company.gstin}</p>
            <p>{company.phone}</p>
            <p>{company.email}</p>
            <p>{company.website}</p>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 self-end pb-2">
        <h2 className="text-3xl font-serif text-gray-900 tracking-wide font-medium">TAX INVOICE</h2>
        {invoiceNumber && (
          <p className="text-[10px] text-gray-500 mt-1">#{invoiceNumber}</p>
        )}
      </div>
    </div>
  );
}
