import { Pause, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RADIO_STREAM_URL } from "@/lib/categories";

export function RadioButton() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(RADIO_STREAM_URL);
        audioRef.current.addEventListener("error", () => {
          setPlaying(false);
          setLoading(false);
        });
      }
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all ${
        playing
          ? "bg-primary text-primary-foreground shadow-float"
          : "bg-navy text-navy-foreground hover:bg-primary hover:text-primary-foreground"
      }`}
      aria-label={playing ? "Pausar rádio" : "Ouça a Rádio Gramado News"}
    >
      {playing ? (
        <>
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse-dot" />
          <Pause className="h-3.5 w-3.5" /> No ar
        </>
      ) : (
        <>
          <Radio className="h-3.5 w-3.5" />
          {loading ? "Conectando..." : "Ouça a Rádio"}
        </>
      )}
    </button>
  );
}
