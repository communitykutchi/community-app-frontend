export interface PresenceStatus {
  isOnline: boolean;
  text: string;
}

export function getPresenceStatus(
  rawIsOnline?: boolean,
  lastActive?: string | Date | null,
  options?: {
    prefix?: "Last seen" | "Active" | "Last active";
  }
): PresenceStatus {
  const prefix = options?.prefix || "Active";

  if (!lastActive) {
    if (rawIsOnline) return { isOnline: true, text: "Active now" };
    return { isOnline: false, text: "Offline" };
  }

  const activeDate = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - activeDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // If marked online and updated within last 35 seconds
  if (rawIsOnline && (isNaN(diffSec) || diffSec < 35)) {
    return { isOnline: true, text: "Active now" };
  }

  if (isNaN(activeDate.getTime())) {
    return { isOnline: false, text: "Offline" };
  }

  const timeStr = activeDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

  const isToday =
    activeDate.getDate() === now.getDate() &&
    activeDate.getMonth() === now.getMonth() &&
    activeDate.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    activeDate.getDate() === yesterday.getDate() &&
    activeDate.getMonth() === yesterday.getMonth() &&
    activeDate.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return { isOnline: false, text: `${prefix} today at ${timeStr}` };
  }

  if (isYesterday) {
    return { isOnline: false, text: `${prefix} yesterday at ${timeStr}` };
  }

  const isSameYear = activeDate.getFullYear() === now.getFullYear();
  const dateStr = activeDate.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });

  return { isOnline: false, text: `${prefix} ${dateStr} at ${timeStr}` };
}

export function formatLastSeen(
  lastActive?: string | Date | null,
  rawIsOnline?: boolean
): string {
  return getPresenceStatus(rawIsOnline, lastActive, { prefix: "Last seen" }).text;
}

export function formatLastActive(
  lastActive?: string | Date | null,
  rawIsOnline?: boolean
): string {
  return getPresenceStatus(rawIsOnline, lastActive, { prefix: "Active" }).text;
}

export function getChatMessageDateLabel(createdAt?: string | Date | null): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return "";

  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1 && diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  const isSameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
}
