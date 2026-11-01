"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";

const noop = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is only known on the client; render a stable label on the server to avoid hydration mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button
      variant="icon"
      icon={SunMoon}
      iconPreset="spin"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      data-testid="theme-toggle"
      onClick={() => setTheme(dark ? "light" : "dark")}
    />
  );
}
