import { describe, it, expect } from "vitest";
import {
  scheduleItemSchema,
  dayScheduleSchema,
  weeklyScheduleSchema,
  validDaySchema,
} from "../schedule.schema.js";

const validItem = {
  time: "05:30",
  endTime: "05:35",
  code: "RVE0",
  title: "Indicatif RVE",
  icon: "radio-outline",
  theme: null,
};

const validDay = {
  day: "lundi",
  dayIndex: 1,
  items: [validItem],
};

describe("scheduleItemSchema", () => {
  it("parses a valid item", () => {
    const result = scheduleItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("accepts null code", () => {
    const result = scheduleItemSchema.safeParse({ ...validItem, code: null });
    expect(result.success).toBe(true);
  });

  it("accepts null theme", () => {
    const result = scheduleItemSchema.safeParse({ ...validItem, theme: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time format", () => {
    const result = scheduleItemSchema.safeParse({ ...validItem, time: "5:30" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid endTime format", () => {
    const result = scheduleItemSchema.safeParse({ ...validItem, endTime: "5:35pm" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = scheduleItemSchema.safeParse({ ...validItem, title: "" });
    expect(result.success).toBe(false);
  });
});

describe("dayScheduleSchema", () => {
  it("parses a valid day schedule", () => {
    const result = dayScheduleSchema.safeParse(validDay);
    expect(result.success).toBe(true);
  });

  it("rejects dayIndex out of range", () => {
    const result = dayScheduleSchema.safeParse({ ...validDay, dayIndex: 7 });
    expect(result.success).toBe(false);
  });

  it("rejects negative dayIndex", () => {
    const result = dayScheduleSchema.safeParse({ ...validDay, dayIndex: -1 });
    expect(result.success).toBe(false);
  });
});

describe("weeklyScheduleSchema", () => {
  it("parses a record of day schedules", () => {
    const result = weeklyScheduleSchema.safeParse({ lundi: validDay });
    expect(result.success).toBe(true);
  });

  it("parses all 7 days", () => {
    const week = Object.fromEntries(
      ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map(
        (day, i) => [day, { day, dayIndex: i === 6 ? 0 : i + 1, items: [validItem] }]
      )
    );
    const result = weeklyScheduleSchema.safeParse(week);
    expect(result.success).toBe(true);
  });
});

describe("validDaySchema", () => {
  it("accepts all valid day names", () => {
    const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    for (const day of days) {
      expect(validDaySchema.safeParse(day).success).toBe(true);
    }
  });

  it("rejects invalid day name", () => {
    expect(validDaySchema.safeParse("monday").success).toBe(false);
    expect(validDaySchema.safeParse("").success).toBe(false);
  });
});
