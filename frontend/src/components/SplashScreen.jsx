import { useEffect, useState } from "react";
import AppIcon from "./AppIcon";

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState("hold");

    useEffect(() => {
        const openTimer = setTimeout(() => setPhase("open"), 1150);
        const doneTimer = setTimeout(() => {
            setPhase("done");
            onDone?.();
        }, 1480);
        return () => {
            clearTimeout(openTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    if (phase === "done") return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            overflow: "hidden",
        }}>
            <style>{`
        @property --wave-r {
          syntax: '<percentage>';
          inherits: false;
          initial-value: 0%;
        }
        @keyframes waveExpand {
          0%   { --wave-r: 0%; }
          100% { --wave-r: 180%; }
        }
        @keyframes iconFlash {

            0% { opacity: 0; }
            1%   { opacity: 0.15; }
            40%  { opacity: 1; }
            100% { opacity: 0; }
        }
        .splash-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            transparent var(--wave-r),
            #0b0a10 calc(var(--wave-r) + 22%)
          );
        }
.splash-overlay.opening {
          animation: waveExpand 280ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .splash-overlay.holding {
          background: #0b0a10;
        }
      `}</style>

            <div className={`splash-overlay ${phase === "open" ? "opening" : "holding"}`} />

            <div style={{
                position: "relative",
                zIndex: 1,
                opacity: 0,
                animation: "iconFlash 1200ms cubic-bezier(0.25,0,0.1,1) 180ms forwards",
            }}>
                <AppIcon size={58} />
            </div>
        </div>
    );
}