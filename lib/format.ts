import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: idLocale,
  });
}

export function fullDate(date: Date | string) {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: idLocale });
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n);
}
