import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoDate));
}
