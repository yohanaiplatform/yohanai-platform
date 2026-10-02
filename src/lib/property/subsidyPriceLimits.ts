// src/lib/property/subsidyPriceLimits.ts

/**
 * Batasan harga jual rumah umum (subsidi FLPP) seluruh Indonesia.
 * Sumber: Lampiran FLPP BSN KPR Sejahtera -- Memo MRF No. /M/MRF/SM/XII/2025
 * tanggal 30 Desember 2025 (screenshot dari Yohan, 2 Okt 2026). Aturan bisa
 * berubah -- update data ini kalau ada memo/lampiran baru, jangan ditebak.
 * File polos (tanpa "use client"): dipakai server (kalkulator KPR, AI Agent).
 */

export interface TapakPriceLimit {
  region: string;
  maxPrice: number;
}

/** Rumah Umum Tapak -- harga jual paling banyak per wilayah. */
export const TAPAK_PRICE_LIMITS: TapakPriceLimit[] = [
  {
    region: "Jawa (kecuali Jakarta, Bogor, Depok, Tangerang, Bekasi) dan Sumatera (kecuali Kep. Riau, Bangka Belitung, Kep. Mentawai)",
    maxPrice: 166_000_000,
  },
  { region: "Kalimantan (kecuali Kabupaten Murung Raya dan Kabupaten Mahakam Ulu)", maxPrice: 182_000_000 },
  { region: "Sulawesi, Bangka Belitung, Kepulauan Mentawai, dan Kepulauan Riau (kecuali Kepulauan Anambas)", maxPrice: 173_000_000 },
  {
    region:
      "Maluku, Maluku Utara, Bali dan Nusa Tenggara, Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi), Kepulauan Anambas, Kabupaten Murung Raya, dan Kabupaten Mahakam Ulu",
    maxPrice: 185_000_000,
  },
  { region: "Papua, Papua Barat, Papua Tengah, Papua Pegunungan, Papua Selatan dan Papua Barat Daya", maxPrice: 240_000_000 },
];

export interface RusunPriceLimit {
  region: string;
  pricePerM2: number;
  maxPrice: number;
}

/** Satuan Rumah Susun Umum -- per provinsi (harga/m2 dan harga jual paling banyak). */
export const RUSUN_PROVINCE_PRICE_LIMITS: RusunPriceLimit[] = [
  { region: "Nangroe Aceh Darussalam", pricePerM2: 8_500_000, maxPrice: 306_000_000 },
  { region: "Sumatera Utara", pricePerM2: 7_800_000, maxPrice: 280_800_000 },
  { region: "Sumatera Barat", pricePerM2: 8_800_000, maxPrice: 316_800_000 },
  { region: "Riau", pricePerM2: 9_500_000, maxPrice: 342_000_000 },
  { region: "Kepulauan Riau", pricePerM2: 10_000_000, maxPrice: 360_000_000 },
  { region: "Jambi", pricePerM2: 8_800_000, maxPrice: 316_800_000 },
  { region: "Bengkulu", pricePerM2: 8_000_000, maxPrice: 288_000_000 },
  { region: "Sumatera Selatan", pricePerM2: 8_700_000, maxPrice: 313_200_000 },
  { region: "Bangka Belitung", pricePerM2: 8_900_000, maxPrice: 320_400_000 },
  { region: "Lampung", pricePerM2: 8_000_000, maxPrice: 288_000_000 },
  { region: "Banten (kecuali Kota/Kabupaten Tangerang dan Kota Tangerang Selatan)", pricePerM2: 7_600_000, maxPrice: 273_600_000 },
  { region: "Jawa Barat (kecuali Kota Depok, Kota/Kabupaten Bogor, dan Kota/Kabupaten Bekasi)", pricePerM2: 7_300_000, maxPrice: 262_800_000 },
  { region: "Jawa Tengah", pricePerM2: 7_200_000, maxPrice: 259_200_000 },
  { region: "Daerah Istimewa Yogyakarta", pricePerM2: 7_300_000, maxPrice: 262_800_000 },
  { region: "Jawa Timur", pricePerM2: 7_900_000, maxPrice: 284_400_000 },
  { region: "Bali", pricePerM2: 8_300_000, maxPrice: 298_800_000 },
  { region: "Nusa Tenggara Barat", pricePerM2: 7_400_000, maxPrice: 266_400_000 },
  { region: "Nusa Tenggara Timur", pricePerM2: 8_600_000, maxPrice: 309_600_000 },
  { region: "Kalimantan Barat", pricePerM2: 9_700_000, maxPrice: 349_200_000 },
  { region: "Kalimantan Tengah", pricePerM2: 9_400_000, maxPrice: 338_400_000 },
  { region: "Kalimantan Utara", pricePerM2: 9_800_000, maxPrice: 352_800_000 },
  { region: "Kalimantan Timur", pricePerM2: 9_900_000, maxPrice: 356_400_000 },
  { region: "Kalimantan Selatan", pricePerM2: 9_000_000, maxPrice: 324_000_000 },
  { region: "Sulawesi Utara", pricePerM2: 7_800_000, maxPrice: 280_800_000 },
  { region: "Gorontalo", pricePerM2: 8_300_000, maxPrice: 298_800_000 },
  { region: "Sulawesi Tengah", pricePerM2: 6_900_000, maxPrice: 248_400_000 },
  { region: "Sulawesi Tenggara", pricePerM2: 8_200_000, maxPrice: 295_200_000 },
  { region: "Sulawesi Barat", pricePerM2: 8_700_000, maxPrice: 313_200_000 },
  { region: "Sulawesi Selatan", pricePerM2: 7_300_000, maxPrice: 262_800_000 },
  { region: "Maluku", pricePerM2: 7_600_000, maxPrice: 273_600_000 },
  { region: "Maluku Utara", pricePerM2: 9_600_000, maxPrice: 345_600_000 },
  { region: "Papua", pricePerM2: 15_700_000, maxPrice: 565_200_000 },
  { region: "Papua Barat", pricePerM2: 10_700_000, maxPrice: 385_200_000 },
];

/** Satuan Rumah Susun Umum -- khusus Kota/Kabupaten (menimpa harga provinsi). */
export const RUSUN_CITY_PRICE_LIMITS: RusunPriceLimit[] = [
  { region: "Kota Jakarta Barat", pricePerM2: 8_900_000, maxPrice: 320_400_000 },
  { region: "Kota Jakarta Selatan", pricePerM2: 9_200_000, maxPrice: 331_200_000 },
  { region: "Kota Jakarta Timur", pricePerM2: 8_800_000, maxPrice: 316_800_000 },
  { region: "Kota Jakarta Utara", pricePerM2: 9_600_000, maxPrice: 345_600_000 },
  { region: "Kota Jakarta Pusat", pricePerM2: 9_300_000, maxPrice: 334_800_000 },
  { region: "Kota/Kabupaten Tangerang dan Kota Tangerang Selatan", pricePerM2: 8_400_000, maxPrice: 302_400_000 },
  { region: "Kota Depok", pricePerM2: 8_500_000, maxPrice: 306_000_000 },
  { region: "Kota/Kabupaten Bogor", pricePerM2: 8_600_000, maxPrice: 309_600_000 },
  { region: "Kota/Kabupaten Bekasi", pricePerM2: 8_400_000, maxPrice: 302_400_000 },
];
