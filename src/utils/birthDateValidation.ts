export function getLatestAllowedBirthDate(): string {
  const latestDate = new Date();
  latestDate.setDate(latestDate.getDate() - 1);
  const year = latestDate.getFullYear();
  const month = String(latestDate.getMonth() + 1).padStart(2, "0");
  const day = String(latestDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  const isValidDate =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return isValidDate && value <= getLatestAllowedBirthDate();
}
