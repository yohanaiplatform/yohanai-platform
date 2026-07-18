// src/constants/dashboard.ts
export const LEAD_STATUS = {
  HOT: "hot",
  WARM: "warm",
  COLD: "cold",
} as const;

export const PROPERTY_STATUS = {
  AVAILABLE: "available",
  BOOKED: "booked",
  SOLD: "sold",
  HOLD: "hold",
} as const;

export const PRIORITY = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export const LIMITS = {
  RECENT_LEADS: 5,
  RECENT_CHATS: 5,
} as const;