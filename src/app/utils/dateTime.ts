const APP_TIME_ZONE = "Asia/Manila";

type DateInput = string | number | Date | null | undefined;

function parseDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function formatLocalDateTime(value: DateInput): string {
  const parsedDate = parseDate(value);

  if (!parsedDate) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
}

export function formatRelativeTime(value: DateInput, now = new Date()): string {
  const parsedDate = parseDate(value);

  if (!parsedDate) {
    return "Recently";
  }

  const diffInSeconds = Math.round((parsedDate.getTime() - now.getTime()) / 1000);
  const absDiffInSeconds = Math.abs(diffInSeconds);

  if (absDiffInSeconds < 60) {
    return "Just now";
  }

  const units: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { limit: 60 * 60, divisor: 60, unit: "minute" },
    { limit: 60 * 60 * 24, divisor: 60 * 60, unit: "hour" },
    { limit: 60 * 60 * 24 * 7, divisor: 60 * 60 * 24, unit: "day" },
    { limit: 60 * 60 * 24 * 30, divisor: 60 * 60 * 24 * 7, unit: "week" },
    { limit: 60 * 60 * 24 * 365, divisor: 60 * 60 * 24 * 30, unit: "month" },
  ];

  for (const unitConfig of units) {
    if (absDiffInSeconds < unitConfig.limit) {
      return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
        Math.round(diffInSeconds / unitConfig.divisor),
        unitConfig.unit
      );
    }
  }

  return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
    Math.round(diffInSeconds / (60 * 60 * 24 * 365)),
    "year"
  );
}

export function formatNotificationTimestamp(value: DateInput): {
  absolute: string;
  relative: string;
} {
  return {
    absolute: formatLocalDateTime(value),
    relative: formatRelativeTime(value),
  };
}
