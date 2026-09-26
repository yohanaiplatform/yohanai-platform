// src/constants/property.ts

export const PROPERTY_STATUS_OPTIONS = ["available", "booked", "sold", "hold"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUS_OPTIONS)[number];

export const CERTIFICATE_TYPE_OPTIONS = ["SHM", "HGB", "Girik", "Lainnya"] as const;
