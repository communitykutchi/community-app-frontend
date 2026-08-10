import { useEffect } from "react";
import API from "../api/axios";
import { getAuthToken } from "../auth/session";

export function usePresence() {
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const sendPresence = (status: "active" | "inactive" | "heartbeat") => {
      const currentToken = getAuthToken();
      if (!currentToken) return;

      try {
        API.post("/users/presence", { status }, { skipAuthAlert: true } as any).catch(() => {});
      } catch {
        // Ignore presence report errors silently
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      sendPresence("active");
      heartbeatTimer = setInterval(() => {
        sendPresence("active");
      }, 10000); // 10 seconds pulse
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    const handlePageHide = () => {
      stopHeartbeat();
    };

    // Initial trigger
    startHeartbeat();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);
}
