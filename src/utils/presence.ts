export interface PresenceStatus {
  isOnline: boolean;
  text: string;
}

export function getPresenceStatus(
  rawIsOnline?: boolean,
  lastActive?: string | Date | null
): PresenceStatus {
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
    return { isOnline: false, text: `Last seen at ${timeStr}` };
  }

  if (isYesterday) {
    return { isOnline: false, text: `Last seen yesterday at ${timeStr}` };
  }

  const dateStr = activeDate.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });

  return { isOnline: false, text: `Last seen ${dateStr} at ${timeStr}` };
}
