/**
 * Mobile-compatible, cross-browser audio recording utilities
 */

export const getBestSupportedAudioMimeType = (): string => {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];

  for (const mime of candidates) {
    try {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return "";
};

export const getAudioStream = async (): Promise<MediaStream> => {
  if (typeof window === "undefined") {
    throw new Error("Browser window is not available.");
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";
  const isHttps = window.location.protocol === "https:";

  // Check secure context requirement for mobile browsers
  if (!isHttps && !isLocalhost && window.isSecureContext === false) {
    throw new Error(
      "Microphone access requires a secure (HTTPS) connection. Please access this website over HTTPS."
    );
  }

  // Modern navigator.mediaDevices API
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      // If advanced constraints failed, fallback to basic constraints
      if (
        err.name === "OverconstrainedError" ||
        err.name === "TypeError" ||
        err.name === "ConstraintNotSatisfiedError"
      ) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      throw err;
    }
  }

  // Legacy API fallback (for older mobile browsers / WebViews)
  const nav = navigator as any;
  const legacyGetUserMedia =
    nav.getUserMedia ||
    nav.webkitGetUserMedia ||
    nav.mozGetUserMedia ||
    nav.msGetUserMedia;

  if (legacyGetUserMedia) {
    return new Promise<MediaStream>((resolve, reject) => {
      legacyGetUserMedia.call(
        navigator,
        { audio: true },
        (stream: MediaStream) => resolve(stream),
        (error: any) => reject(error)
      );
    });
  }

  throw new Error(
    "Microphone recording is not supported in this browser. Please use Chrome, Safari, or a modern browser."
  );
};

export const createSafeMediaRecorder = (stream: MediaStream): MediaRecorder => {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not supported in this browser.");
  }

  const preferredMime = getBestSupportedAudioMimeType();

  if (preferredMime) {
    try {
      return new MediaRecorder(stream, { mimeType: preferredMime });
    } catch (err) {
      console.warn("Failed creating MediaRecorder with mimeType, trying default:", err);
    }
  }

  // Fallback to browser default (works best on iOS Safari)
  return new MediaRecorder(stream);
};

export const startMediaRecorderSafely = (recorder: MediaRecorder) => {
  try {
    recorder.start(200);
  } catch {
    try {
      // Fallback without timeslice for Safari/WebKit
      recorder.start();
    } catch (err2) {
      console.error("Failed to start MediaRecorder:", err2);
      throw err2;
    }
  }
};

export const formatAudioError = (err: any): string => {
  if (!err) return "Unable to start voice recording.";

  const errorName = err.name || "";
  const errorMessage = String(err.message || "");

  if (
    errorName === "NotAllowedError" ||
    errorName === "PermissionDeniedError" ||
    errorMessage.toLowerCase().includes("permission") ||
    errorMessage.toLowerCase().includes("denied")
  ) {
    return "Microphone permission was denied. Please allow microphone access in your browser/phone settings.";
  }

  if (
    errorName === "NotFoundError" ||
    errorName === "DevicesNotFoundError" ||
    errorMessage.toLowerCase().includes("not found")
  ) {
    return "No microphone found on this device.";
  }

  if (
    errorName === "NotReadableError" ||
    errorName === "TrackStartError" ||
    errorMessage.toLowerCase().includes("could not start") ||
    errorMessage.toLowerCase().includes("already in use")
  ) {
    return "Microphone is in use by another app or cannot be accessed.";
  }

  if (
    errorName === "SecurityError" ||
    errorMessage.toLowerCase().includes("https") ||
    errorMessage.toLowerCase().includes("secure")
  ) {
    return errorMessage || "Microphone access requires a secure (HTTPS) connection.";
  }

  if (
    errorName === "NotSupportedError" ||
    errorMessage.toLowerCase().includes("supported")
  ) {
    return "Audio recording is not supported in this browser.";
  }

  return errorMessage || "Microphone could not be accessed. Please check permissions.";
};
