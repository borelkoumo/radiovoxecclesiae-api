export interface Prayer {
  id: string;
  text: string;
  author: string;
  isAnonymous: boolean;
  createdAt: string; // ISO 8601
  status: "approved" | "pending" | "rejected";
}

export interface PrayerListResult {
  prayers: Prayer[];
  nextCursor: string | null;
}
