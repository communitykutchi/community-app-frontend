import React, { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  url: string;
  duration?: number;
  isOutgoing?: boolean;
}

export default function AudioPlayer({ url, duration, isOutgoing }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate deterministic pseudo-random waveform bar heights for realistic voice effect
  const waveformHeights = useRef<number[]>([]);
  if (waveformHeights.current.length === 0) {
    const barsCount = 28;
    const seedString = url || "default_voice_seed";
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = (hash << 5) - hash + seedString.charCodeAt(i);
      hash |= 0;
    }
    const heights: number[] = [];
    for (let i = 0; i < barsCount; i++) {
      const pseudoRand = Math.abs(Math.sin(hash + i * 999));
      // clamp height between 20% and 100%
      heights.push(Math.floor(20 + pseudoRand * 80));
    }
    waveformHeights.current = heights;
  }

  const getAudioSrc = (srcUrl: string) => {
    if (!srcUrl) return "";
    if (srcUrl.startsWith("http://") || srcUrl.startsWith("https://") || srcUrl.startsWith("blob:")) {
      return srcUrl;
    }
    const baseURL = (import.meta as any).env?.VITE_API_URL || "https://backend.kutchicommunity.com/api";
    const cleanBase = baseURL.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return srcUrl.startsWith("/") ? `${cleanBase}${srcUrl}` : `${cleanBase}/${srcUrl}`;
  };

  const fullAudioSrc = getAudioSrc(url);

  useEffect(() => {
    if (duration && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      setIsLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error("Audio playback error:", err);
        setIsPlaying(false);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0 && !audioDuration) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = pos * audioDuration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = audioDuration ? Math.min(100, Math.max(0, (currentTime / audioDuration) * 100)) : 0;

  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full max-w-[280px] sm:max-w-[300px] min-w-0 my-1 select-none transition-all duration-200 ${
        isOutgoing
          ? "bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white shadow-sm"
          : "bg-white text-slate-800 border border-slate-200/90 shadow-sm"
      }`}
    >
      <audio
        ref={audioRef}
        src={fullAudioSrc}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          console.error("Audio element error:", e);
          setIsPlaying(false);
          setHasError(true);
        }}
      />

      {/* Modern Play / Pause / Loading Button */}
      <button
        type="button"
        onClick={togglePlay}
        title={hasError ? "Audio load failed. Click to retry." : isPlaying ? "Pause voice message" : "Play voice message"}
        className={`relative h-10 w-10 shrink-0 flex items-center justify-center rounded-full font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md focus:outline-none focus:ring-2 ${
          hasError
            ? "bg-rose-500 text-white focus:ring-rose-400"
            : isOutgoing
            ? "bg-white text-teal-800 hover:bg-emerald-50 focus:ring-white/50"
            : "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500/50"
        }`}
      >
        {/* Subtle pulsing background ring when playing */}
        {isPlaying && (
          <span
            className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
              isOutgoing ? "bg-white" : "bg-teal-500"
            }`}
          />
        )}

        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : hasError ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : isPlaying ? (
          /* Pause Icon */
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          /* Play Icon - offset slightly right for optical centering */
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Main Content Area: Waveform + Time info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Interactive Audio Waveform Scrub Bar */}
        <div
          className="group relative h-7 w-full flex items-center gap-[2px] cursor-pointer py-1"
          onClick={handleSeek}
          title="Click to jump to time"
        >
          {waveformHeights.current.map((heightPercent, idx) => {
            const barProgress = (idx / waveformHeights.current.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <span
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isOutgoing
                      ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                      : "bg-teal-600"
                    : isOutgoing
                    ? "bg-white/35 group-hover:bg-white/50"
                    : "bg-slate-300 group-hover:bg-slate-400"
                }`}
                style={{
                  height: `${heightPercent}%`,
                  minHeight: "4px",
                }}
              />
            );
          })}
        </div>

        {/* Time counter & Details */}
        <div className="flex items-center justify-between text-[11px] font-medium leading-none tracking-tight">
          <span className={`font-mono ${isOutgoing ? "text-teal-100" : "text-slate-600"}`}>
            {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(audioDuration)}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Voice note indicator */}
            <span className={`flex items-center gap-1 opacity-90 ${isOutgoing ? "text-teal-100" : "text-slate-500"}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {hasError ? "Failed" : "Voice"}
            </span>

            {/* Playback speed multiplier button */}
            <button
              type="button"
              onClick={cycleSpeed}
              title="Click to change playback speed (1x, 1.5x, 2x)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                isOutgoing
                  ? "bg-white/20 hover:bg-white/35 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
