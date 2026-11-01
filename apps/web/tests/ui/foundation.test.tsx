import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Ban, Download, Stamp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedIcon, type IconPreset } from "@/components/icons/AnimatedIcon";
import { dur, ease, motionPreset, spring, type TransitionName } from "@/lib/motion";

const NAMES: TransitionName[] = ["snappy", "marker", "stamp", "out", "inOut", "drawer", "press", "release", "micro", "std", "max"];
const PRESETS: IconPreset[] = ["nudge-x", "nudge-y", "spin", "pop", "draw"];
const label = fc.stringMatching(/^[A-Z][a-z]{2,12}( [a-z]{2,10}){0,3}$/);

describe("lib/motion tokens", () => {
  it("match DESIGN.md §7.1 exactly", () => {
    expect(ease).toEqual({ out: [0.23, 1, 0.32, 1], inOut: [0.77, 0, 0.175, 1], drawer: [0.32, 0.72, 0, 1] });
    expect(dur).toEqual({ press: 0.09, release: 0.16, micro: 0.12, std: 0.2, max: 0.3, drawer: 0.5 });
    expect(spring.stamp).toEqual({ type: "spring", stiffness: 650, damping: 20, mass: 1.3 });
  });

  it("reduced motion makes every transition instant; full motion never exceeds the drawer duration (100 runs)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...NAMES), fc.boolean(), (name, reduced) => {
        const t = motionPreset(reduced).transition(name) as Record<string, unknown>;
        if (reduced) expect(t).toEqual({ duration: 0 });
        else if (name in spring) expect(t.type).toBe("spring");
        else expect(t.duration as number).toBeLessThanOrEqual(name === "drawer" ? dur.drawer : dur.max);
        expect(motionPreset(reduced).fade.duration).toBe(dur.std); // opacity fades survive reduced motion
      }),
      { numRuns: 100 },
    );
  });
});

describe("NeoPOP Button", () => {
  it("renders every variant and state as a real, labelled button (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("primary", "secondary", "ghost", "hold", "icon"),
        fc.constantFrom("md", "sm"),
        fc.boolean(),
        fc.boolean(),
        label,
        (variant, size, loading, disabled, text) => {
          cleanup(); // a failed run (or shrink) must not leak DOM into the next one
          const { unmount } =
            variant === "icon"
              ? render(<Button variant="icon" icon={X} aria-label={text} size={size} loading={loading} disabled={disabled} />)
              : variant === "hold"
                ? render(<Button variant="hold" icon={Ban} onHoldComplete={() => {}} size={size} loading={loading} disabled={disabled}>{text}</Button>)
                : render(<Button variant={variant} icon={Stamp} size={size} loading={loading} disabled={disabled}>{text}</Button>);
          const btn = screen.getByRole<HTMLButtonElement>("button", { name: text });
          expect(btn).toHaveClass("btn", `btn-${variant}`);
          expect(btn.classList.contains("btn-sm")).toBe(size === "sm");
          expect(btn).toHaveAttribute("type", "button");
          expect(btn.hasAttribute("aria-busy")).toBe(loading);
          expect(btn.disabled).toBe(disabled);
          expect(btn.querySelectorAll("svg").length).toBeGreaterThan(0); // icons, never emoji
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("fires onClick and forwards data attributes", () => {
    const onClick = vi.fn();
    render(<Button variant="secondary" icon={Download} data-testid="dl" onClick={onClick}>Download report</Button>);
    fireEvent.click(screen.getByTestId("dl"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("hold to decline completes only when the fill finishes while held", () => {
    const done = vi.fn();
    render(<Button variant="hold" onHoldComplete={done}>Hold to decline</Button>);
    const btn = screen.getByRole("button", { name: "Hold to decline" });
    const fill = btn.querySelector(".hold-fill")!;
    const fillEnd = () => act(() => { fill.dispatchEvent(Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "transform" })); });

    fireEvent.pointerDown(btn);
    expect(btn).toHaveAttribute("data-holding", "true");
    fireEvent.pointerUp(btn); // released early: drains, no decline
    fillEnd();
    expect(done).not.toHaveBeenCalled();

    fireEvent.keyDown(btn, { key: " " });
    fillEnd();
    expect(done).toHaveBeenCalledOnce();
    expect(btn).toHaveAttribute("data-holding", "false");
    expect(btn).toHaveAttribute("data-done", "true");
  });

  it("disabled hold button never starts filling", () => {
    render(<Button variant="hold" onHoldComplete={() => {}} disabled>Hold to decline</Button>);
    const btn = screen.getByRole("button", { name: "Hold to decline" });
    fireEvent.pointerDown(btn);
    expect(btn).toHaveAttribute("data-holding", "false");
  });
});

describe("AnimatedIcon", () => {
  it("renders every preset at every size with the right stroke and a11y (100 runs)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRESETS), fc.constantFrom(16, 20, 24, 40, 56 as const), fc.option(label, { nil: undefined }), (preset, size, name) => {
        const { container, unmount } = render(<AnimatedIcon icon={Stamp} preset={preset} size={size} label={name} />);
        const span = container.firstElementChild as HTMLElement;
        const svg = span.querySelector("svg")!;
        expect(span.dataset.iconPreset).toBe(preset);
        expect(svg.getAttribute("width")).toBe(String(size));
        expect(svg.getAttribute("stroke-width")).toBe(size <= 16 ? "2" : "1.75");
        if (name) expect(screen.getByRole("img", { name })).toBe(span);
        else expect(span).toHaveAttribute("aria-hidden", "true");
        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
