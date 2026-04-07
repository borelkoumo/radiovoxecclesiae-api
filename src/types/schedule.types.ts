export interface ScheduleItem {
  time: string;
  endTime: string;
  code: string | null;
  title: string;
  icon: string;
  theme: string | null;
}

export interface DaySchedule {
  day: string; // 'lundi', 'mardi', etc.
  dayIndex: number; // JS Date.getDay() — 0=dimanche, 1=lundi … 6=samedi
  items: ScheduleItem[];
}

export type WeeklySchedule = Record<string, DaySchedule>;
