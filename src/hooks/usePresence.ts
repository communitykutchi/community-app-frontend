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

      if (status === "inactive" && navigator.sendBeacon) {
        try {
          const baseURL = API.defaults.baseURL || "";
          const url = `${baseURL}/users/presence`;
          const blob = new Blob([JSON.stringify({ status: "inactive" })], {
            type: "application/json",
          });
          // sendBeacon handles unload/visibility transitions cleanly
          navigator.sendBeacon(url, blob);
        } catch {
          API.post("/users/presence", { status: "inactive" }).catch(() => {});
        }
        return;
      }

      API.post("/users/presence", { status }).catch(() => {});
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      sendPresence("active");
      heartbeatTimer = setInterval(() => {
        sendPresence("active");
      }, 8000); // 8 seconds pulse
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
      sendPresence("inactive");
    };

    // Initial trigger
    startHeartbeat();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, []);
}
