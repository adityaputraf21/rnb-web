export type NotifRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  createdAt: string | Date;
};

export type NotifGroup = {
  ids: string[];
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  createdAt: string;
  count: number;
};

const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Gabungkan notifikasi berurutan dengan tipe + url sama (mis. beberapa like
 * di status yang sama) menjadi satu baris berjumlah. Input harus terurut
 * dari yang terbaru.
 */
export function groupNotifications(items: NotifRow[]): NotifGroup[] {
  const out: NotifGroup[] = [];
  for (const n of items) {
    const last = out[out.length - 1];
    const t = new Date(n.createdAt).toISOString();
    if (
      last &&
      last.url &&
      last.url === n.url &&
      last.type === n.type &&
      Math.abs(+new Date(last.createdAt) - +new Date(t)) < WINDOW_MS
    ) {
      last.ids.push(n.id);
      last.count += 1;
      last.read = last.read && n.read;
    } else {
      out.push({
        ids: [n.id],
        type: n.type,
        title: n.title,
        body: n.body,
        url: n.url,
        read: n.read,
        createdAt: t,
        count: 1,
      });
    }
  }
  return out;
}
