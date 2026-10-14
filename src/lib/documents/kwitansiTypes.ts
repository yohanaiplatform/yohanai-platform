// src/lib/documents/kwitansiTypes.ts
//
// Tipe formulir Kwitansi Booking Unit. File polos (server + client). Data penerima (agen/perusahaan/rekening) memakai
// isian tetap yang sama dengan MoU (property.document_settings, lihat mouTypes.MouParty2).

import type { MouParty2 } from "@/lib/documents/mouTypes";

export interface KwitansiForm {
  buyer: {
    name: string;
    phone: string;
    address: string;
  };
  unit: {
    projectName: string;
    unitLabel: string;
    type: string;
    price: string;
  };
  payment: {
    amount: string;
    purpose: string;
    method: "Transfer" | "Tunai" | "Lainnya";
    date: string;
    notes: string;
  };
  party2: MouParty2;
  signPlace: string;
}

export interface KwitansiListingInfo {
  title: string;
}
