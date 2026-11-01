"use client";

import { useState } from "react";
import { Ban, Download, Stamp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ButtonStates() {
  const [phase, setPhase] = useState<"idle" | "loading" | "success">("idle");
  const [held, setHeld] = useState(0);

  const run = () => {
    setPhase("loading");
    setTimeout(() => setPhase("success"), 900);
    setTimeout(() => setPhase("idle"), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <Button icon={Stamp} iconPreset="nudge-y" loading={phase === "loading"} success={phase === "success"} onClick={run}>
          {phase === "success" ? "Assessment saved" : "Run assessment"}
        </Button>
        <Button variant="secondary" icon={Download} iconPreset="nudge-y">Download report</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="icon" icon={X} iconPreset="pop" aria-label="Close panel" />
        <Button variant="hold" icon={Ban} iconPreset="draw" onHoldComplete={() => setHeld((n) => n + 1)}>
          Hold to decline
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <Button size="sm">Small primary</Button>
        <Button size="sm" variant="secondary">Small secondary</Button>
        <Button disabled>Disabled primary</Button>
        <Button variant="secondary" disabled>Disabled secondary</Button>
        <Button loading>Loading</Button>
      </div>
      <p className="type-small text-ink-3" aria-live="polite">
        Hold to decline completed {held} {held === 1 ? "time" : "times"}.
      </p>
    </div>
  );
}
