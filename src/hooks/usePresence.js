import { useEffect } from "react";
import API from "../api/axios.js";
import { getAuthToken } from "../auth/session.js";
export function usePresence() {
    useEffect(() => {
        const token = getAuthToken();
        if (!token)
            return;
        let heartbeatTimer = null;
        const sendPresence = (status) => {
            const currentToken = getAuthToken();
            if (!currentToken)
                return;
            if (status === "inactive" && navigator.sendBeacon) {
                try {
                    const baseURL = API.defaults.baseURL || "";
                    const url = `${baseURL}/users/presence`;
                    const blob = new Blob([JSON.stringify({ status: "inactive" })], {
                        type: "application/json",
                    });
                    // sendBeacon handles unload/visibility transitions cleanly
                    navigator.sendBeacon(url, blob);
                }
                catch {
                    API.post("/users/presence", { status: "inactive" }).catch(() => { });
                }
                return;
            }
            API.post("/users/presence", { status }).catch(() => { });
        };
        const startHeartbeat = () => {
            stopHeartbeat();
            sendPresence("active");
            heartbeatTimer = setInterval(() => {
                if (document.visibilityState === "visible") {
                    sendPresence("heartbeat");
                }
            }, 12000); // 12 seconds pulse
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
            }
            else {
                stopHeartbeat();
                sendPresence("inactive");
            }
        };
        const handleWindowFocus = () => {
            startHeartbeat();
        };
        const handleWindowBlur = () => {
            stopHeartbeat();
            sendPresence("inactive");
        };
        const handlePageHide = () => {
            stopHeartbeat();
            sendPresence("inactive");
        };
        // Initial trigger
        if (document.visibilityState === "visible") {
            startHeartbeat();
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleWindowFocus);
        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("beforeunload", handlePageHide);
        return () => {
            stopHeartbeat();
            sendPresence("inactive");
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleWindowFocus);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("beforeunload", handlePageHide);
        };
    }, []);
}
