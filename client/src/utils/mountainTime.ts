export const SCHEDULE_TIME_ZONE = "America/Edmonton";
export const SCHEDULE_TIME_ZONE_LABEL = "Mountain Time";

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHEDULE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsAt(instant: Date): ZonedParts {
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts["year"]),
    month: Number(parts["month"]),
    day: Number(parts["day"]),
    hour: Number(parts["hour"]),
    minute: Number(parts["minute"]),
    second: Number(parts["second"]),
  };
}

export function mountainDateTimeParts(value: string): { date: string; time: string } {
  const parts = partsAt(new Date(value));
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
  };
}

export function mountainDateToday(): string {
  return mountainDateTimeParts(new Date().toISOString()).date;
}

export function mountainDateTimeToUtc(date: string, time: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) throw new Error("Enter a valid Mountain date and time.");

  const requested: ZonedParts = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(timeMatch[1]), minute: Number(timeMatch[2]), second: 0,
  };
  const wallClockAsUtc = Date.UTC(
    requested.year, requested.month - 1, requested.day,
    requested.hour, requested.minute, requested.second,
  );
  let instant = wallClockAsUtc;

  // Resolve the Mountain offset using IANA timezone rules, including daylight saving.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(new Date(instant));
    const actualAsUtc = Date.UTC(
      actual.year, actual.month - 1, actual.day,
      actual.hour, actual.minute, actual.second,
    );
    instant += wallClockAsUtc - actualAsUtc;
  }

  const resolved = partsAt(new Date(instant));
  if (Object.keys(requested).some((key) => resolved[key as keyof ZonedParts] !== requested[key as keyof ZonedParts])) {
    throw new Error("That time does not exist in Mountain Time because of the daylight saving change.");
  }
  return new Date(instant);
}
