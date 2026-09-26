// src/lib/i18n/dictionaries.ts
//
// Kamus terjemahan modul CRM (ID/EN). Sengaja BUKAN library i18n penuh
// (next-intl dkk) -- scope-nya cuma toggle + CRM dulu, bukan routing
// /en /id. Nilai DATA (kategori/sumber/temperature/sudah survey) sengaja
// TIDAK diterjemahkan -- itu data asli tersimpan di database (bahasa
// Google Form asli), menerjemahkan tampilannya tanpa menerjemahkan nilai
// yang difilter/dicari akan bikin mismatch. Yang diterjemahkan cuma UI
// chrome: label, tombol, heading, placeholder, empty state.

export type Locale = "id" | "en";

export interface CrmDictionary {
  list: {
    title: string;
    description: string;
    exportCsv: string;
    addLead: string;
    activeFilter: string;
    clearFilter: string;
    search: string;
    searchPlaceholder: string;
    dateFrom: string;
    dateTo: string;
    category: string;
    allCategory: string;
    source: string;
    allSource: string;
    apply: string;
    reset: string;
    table: {
      name: string;
      contact: string;
      source: string;
      category: string;
      status: string;
      dateIn: string;
      action: string;
      noName: string;
    };
    emptyTitle: string;
    emptyDescription: string;
    errorTitle: string;
    errorDescription: string;
    // String murni, bukan fungsi -- objek t dilewatkan sebagai prop ke
    // client component ("use client"), dan React tidak bisa
    // menyerialisasi fungsi lewat batas Server->Client. Disusun jadi
    // kalimat langsung di komponen server yang butuh (lihat
    // LeadListPagination.tsx).
    pageLabel: string;
    ofLabel: string;
    leadUnit: string;
    prev: string;
    next: string;
    pageSizeLabel: string;
  };
  detail: {
    back: string;
    /** Prefix kalimat "Lead masuk <tanggal>" -- disusun di server, lihat catatan di list.pageLabel. */
    leadInPrefix: string;
    status: string;
    assignedTo: string;
    unassigned: string;
    loading: string;
    you: string;
    assignError: string;
    phone: string;
    email: string;
    lastFollowUp: string;
    submittedDate: string;
    lastUpdated: string;
    detailTitle: string;
    detailDescription: string;
    edit: string;
    save: string;
    saving: string;
    cancel: string;
    source: string;
    category: string;
    temperature: string;
    surveyed: string;
    unitLocation: string;
    request: string;
    comment: string;
    saveError: string;
    requiredError: string;
    notesTitle: string;
    notesDescription: string;
    notePlaceholder: string;
    addNote: string;
    addingNote: string;
    noNotes: string;
    noteError: string;
    teamFallback: string;
  };
  addLead: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    source: string;
    sourcePlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    unitLocation: string;
    unitLocationPlaceholder: string;
    temperature: string;
    temperaturePlaceholder: string;
    surveyed: string;
    surveyedPlaceholder: string;
    assignedTo: string;
    assignedToPlaceholder: string;
    request: string;
    requestPlaceholder: string;
    comment: string;
    commentPlaceholder: string;
    submit: string;
    submitting: string;
    requiredError: string;
    submitError: string;
  };
  status: Record<
    "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost",
    string
  >;
}

export const dictionaries: Record<Locale, CrmDictionary> = {
  id: {
    list: {
      title: "CRM",
      description: "Lead dari Google Form dan channel lain, tersimpan di database.",
      exportCsv: "Export CSV",
      addLead: "+ Tambah Lead",
      activeFilter: "Filter aktif:",
      clearFilter: "Hapus filter",
      search: "Cari",
      searchPlaceholder: "Nama, No. HP, atau lokasi (mis. Serdam, UNTAN)",
      dateFrom: "Dari Tanggal",
      dateTo: "Sampai Tanggal",
      category: "Property / Kategori",
      allCategory: "Semua Property",
      source: "Sumber Informasi",
      allSource: "Semua Sumber",
      apply: "Terapkan",
      reset: "Reset",
      table: {
        name: "Nama",
        contact: "Kontak",
        source: "Sumber",
        category: "Kategori",
        status: "Status",
        dateIn: "Tanggal Masuk",
        action: "Aksi",
        noName: "Tanpa Nama",
      },
      emptyTitle: "Belum Ada Lead",
      emptyDescription: "Lead dari Google Form akan muncul di sini setelah masuk.",
      errorTitle: "Error",
      errorDescription: "Gagal memuat data lead. Coba muat ulang halaman.",
      pageLabel: "Halaman",
      ofLabel: "dari",
      leadUnit: "lead",
      prev: "Sebelumnya",
      next: "Berikutnya",
      pageSizeLabel: "Tampilkan per halaman",
    },
    detail: {
      back: "Kembali ke daftar lead",
      leadInPrefix: "Lead masuk",
      status: "Status",
      assignedTo: "Ditugaskan ke",
      unassigned: "Belum ditugaskan",
      loading: "Memuat...",
      you: "Anda",
      assignError: "Gagal menyimpan assignment. Coba lagi.",
      phone: "Telepon",
      email: "Email",
      lastFollowUp: "Follow-up Terakhir",
      submittedDate: "Tanggal Submit Form",
      lastUpdated: "Terakhir Diperbarui",
      detailTitle: "Detail Lead",
      detailDescription: "Bisa diubah kapan saja saat ada follow-up baru.",
      edit: "Edit",
      save: "Save",
      saving: "Menyimpan...",
      cancel: "Batal",
      source: "Sumber",
      category: "Kategori",
      temperature: "Temperature Awal",
      surveyed: "Sudah Survey",
      unitLocation: "Minat Unit / Lokasi",
      request: "Permintaan",
      comment: "Komentar",
      saveError: "Gagal menyimpan perubahan. Coba lagi.",
      requiredError: "Nama, No. HP, dan Ditugaskan ke wajib diisi.",
      notesTitle: "Catatan",
      notesDescription: "Riwayat update, dengan waktu -- tidak menimpa catatan sebelumnya.",
      notePlaceholder: "mis. Lead sudah dapat unit di lokasi lain, follow-up dihentikan",
      addNote: "Tambah Catatan",
      addingNote: "Menyimpan...",
      noNotes: "Belum ada catatan.",
      noteError: "Gagal menyimpan catatan. Coba lagi.",
      teamFallback: "Tim",
    },
    addLead: {
      title: "Tambah Lead",
      description: "Input manual untuk lead dari telepon, walk-in, atau sumber lain di luar Google Form.",
      name: "Nama *",
      namePlaceholder: "mis. Budi Santoso",
      phone: "No. HP *",
      phonePlaceholder: "mis. 08123456789",
      email: "Email",
      emailPlaceholder: "opsional",
      source: "Sumber Informasi",
      sourcePlaceholder: "Pilih sumber",
      category: "Kategori / Property",
      categoryPlaceholder: "Pilih kategori",
      unitLocation: "Minat Unit / Lokasi",
      unitLocationPlaceholder: "mis. Ampera Raya",
      temperature: "Temperature Awal",
      temperaturePlaceholder: "Pilih temperature",
      surveyed: "Sudah Survey",
      surveyedPlaceholder: "Pilih",
      assignedTo: "Ditugaskan ke *",
      assignedToPlaceholder: "Pilih agent",
      request: "Permintaan",
      requestPlaceholder: "mis. Nanti survey tanggal 8 atau 9",
      comment: "Komentar",
      commentPlaceholder: "Catatan tambahan",
      submit: "Simpan Lead",
      submitting: "Menyimpan...",
      requiredError: "Nama, No. HP, dan Ditugaskan ke wajib diisi.",
      submitError: "Gagal menyimpan lead. Coba lagi.",
    },
    status: {
      new: "Baru",
      contacted: "Dihubungi",
      qualified: "Memenuhi Syarat",
      proposal: "Proposal",
      negotiation: "Negosiasi",
      won: "Menang",
      lost: "Kalah",
    },
  },
  en: {
    list: {
      title: "CRM",
      description: "Leads from Google Form and other channels, stored in the database.",
      exportCsv: "Export CSV",
      addLead: "+ Add Lead",
      activeFilter: "Active filter:",
      clearFilter: "Clear filter",
      search: "Search",
      searchPlaceholder: "Name, phone, or location (e.g. Serdam, UNTAN)",
      dateFrom: "From Date",
      dateTo: "To Date",
      category: "Property / Category",
      allCategory: "All Properties",
      source: "Source",
      allSource: "All Sources",
      apply: "Apply",
      reset: "Reset",
      table: {
        name: "Name",
        contact: "Contact",
        source: "Source",
        category: "Category",
        status: "Status",
        dateIn: "Date In",
        action: "Action",
        noName: "No Name",
      },
      emptyTitle: "No Leads Yet",
      emptyDescription: "Leads from Google Form will appear here once submitted.",
      errorTitle: "Error",
      errorDescription: "Failed to load lead data. Try reloading the page.",
      pageLabel: "Page",
      ofLabel: "of",
      leadUnit: "leads",
      prev: "Previous",
      next: "Next",
      pageSizeLabel: "Show per page",
    },
    detail: {
      back: "Back to lead list",
      leadInPrefix: "Lead received",
      status: "Status",
      assignedTo: "Assigned To",
      unassigned: "Unassigned",
      loading: "Loading...",
      you: "You",
      assignError: "Failed to save assignment. Please try again.",
      phone: "Phone",
      email: "Email",
      lastFollowUp: "Last Follow-up",
      submittedDate: "Form Submitted Date",
      lastUpdated: "Last Updated",
      detailTitle: "Lead Detail",
      detailDescription: "Can be updated any time there's a new follow-up.",
      edit: "Edit",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      source: "Source",
      category: "Category",
      temperature: "Initial Temperature",
      surveyed: "Site Visited",
      unitLocation: "Unit / Location Interest",
      request: "Request",
      comment: "Comment",
      saveError: "Failed to save changes. Please try again.",
      requiredError: "Name, phone, and Assigned To are required.",
      notesTitle: "Notes",
      notesDescription: "Timestamped update history -- doesn't overwrite previous notes.",
      notePlaceholder: "e.g. Lead already got a unit elsewhere, follow-up stopped",
      addNote: "Add Note",
      addingNote: "Saving...",
      noNotes: "No notes yet.",
      noteError: "Failed to save note. Please try again.",
      teamFallback: "Team",
    },
    addLead: {
      title: "Add Lead",
      description: "Manual entry for leads from phone calls, walk-ins, or other sources outside Google Form.",
      name: "Name *",
      namePlaceholder: "e.g. Budi Santoso",
      phone: "Phone *",
      phonePlaceholder: "e.g. 08123456789",
      email: "Email",
      emailPlaceholder: "optional",
      source: "Source",
      sourcePlaceholder: "Select source",
      category: "Category / Property",
      categoryPlaceholder: "Select category",
      unitLocation: "Unit / Location Interest",
      unitLocationPlaceholder: "e.g. Ampera Raya",
      temperature: "Initial Temperature",
      temperaturePlaceholder: "Select temperature",
      surveyed: "Site Visited",
      surveyedPlaceholder: "Select",
      assignedTo: "Assigned To *",
      assignedToPlaceholder: "Select agent",
      request: "Request",
      requestPlaceholder: "e.g. Site visit planned for the 8th or 9th",
      comment: "Comment",
      commentPlaceholder: "Additional notes",
      submit: "Save Lead",
      submitting: "Saving...",
      requiredError: "Name, phone, and Assigned To are required.",
      submitError: "Failed to save lead. Please try again.",
    },
    status: {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      proposal: "Proposal",
      negotiation: "Negotiation",
      won: "Won",
      lost: "Lost",
    },
  },
};
