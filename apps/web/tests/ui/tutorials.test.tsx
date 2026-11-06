// Tutorials page: search filter, topic data, and the arrow that reveals a topic's video and description.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { filterChapters, renderTutorials, TUTORIALS, type TutorialData } from "@/components/tutorial/tutorials";
import { countRuns } from "../count-runs";

const SAMPLE: TutorialData = {
  full: { src: "/tutorial/full.mp4", poster: "/tutorial/poster.jpg", duration: "25:46" },
  chapters: [
    { num: 6, title: "Assess", topics: [
      { id: "a", title: "Run the assessment", description: "Press Run assessment to stamp a decision.", duration: "0:30", src: "/tutorial/clips/a.mp4" },
      { id: "b", title: "Download the PDF", description: "Creates a sanction report.", duration: "0:20", src: "/tutorial/clips/b.mp4" },
    ] },
    { num: 9, title: "Batch", topics: [{ id: "c", title: "Upload a file", description: "Choose a CSV prepared from the template.", duration: "0:25", src: "/tutorial/clips/c.mp4" }] },
  ],
};

const topics = (d: TutorialData) => d.chapters.flatMap((c) => c.topics);
const toggle = (id: string) => document.querySelector<HTMLButtonElement>(`[data-topic="${id}"] .tut-toggle`)!;
const panel = (id: string) => document.querySelector<HTMLElement>(`[data-topic="${id}"] .tut-panel`)!;

function mount(d: TutorialData = SAMPLE) {
  document.body.innerHTML = '<div class="tut-root" id="r"></div>';
  renderTutorials(document.getElementById("r")!, undefined, d);
}

beforeAll(() => {
  // jsdom has no media playback.
  HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => { document.body.innerHTML = ""; });

describe("F24 tutorials", () => {
  it("every word typed must match; results are always a subset, and no chapter is left empty (100 runs)", () => {
    const pool = TUTORIALS.chapters.flatMap((c) => c.topics).flatMap((t) => t.title.split(/\s+/));
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constantFrom(...pool), fc.string({ maxLength: 8 })), { maxLength: 4 }), countRuns("F24", (ws: string[]) => {
        const query = ws.join(" ");
        const out = filterChapters(TUTORIALS.chapters, query);
        const all = new Set(topics(TUTORIALS).map((t) => t.id));
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        for (const c of out) {
          expect(c.topics.length).toBeGreaterThan(0);
          for (const t of c.topics) {
            expect(all.has(t.id)).toBe(true);
            const text = `${c.title} ${t.title} ${t.description}`.toLowerCase();
            for (const w of words) expect(text).toContain(w);
          }
        }
        if (!words.length) expect(out).toEqual(TUTORIALS.chapters);
      })),
      { numRuns: 100 },
    );
  });

  it("finds a feature regardless of case, and across title and description", () => {
    expect(topics({ ...SAMPLE, chapters: filterChapters(SAMPLE.chapters, "PDF") }).map((t) => t.id)).toEqual(["b"]);
    expect(topics({ ...SAMPLE, chapters: filterChapters(SAMPLE.chapters, "sanction report") }).map((t) => t.id)).toEqual(["b"]);
    expect(filterChapters(SAMPLE.chapters, "zzz")).toEqual([]);
  });

  it("every real topic has a title, a written description, a duration and its own clip", () => {
    const list = topics(TUTORIALS);
    expect(list.length).toBeGreaterThan(30);
    expect(new Set(list.map((t) => t.id)).size).toBe(list.length);
    for (const t of list) {
      expect(t.title.length).toBeGreaterThan(3);
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.duration).toMatch(/^\d+:\d\d$/);
      expect(t.src).toBe(`/tutorial/clips/${t.id}.mp4`);
    }
  });

  it("a closed topic has no video; the arrow reveals it with the description, and closes it again", () => {
    mount();
    expect(panel("a").hidden).toBe(true);
    expect(document.querySelectorAll(".tut-panel video").length).toBe(0);
    toggle("a").click();
    expect(toggle("a").getAttribute("aria-expanded")).toBe("true");
    expect(panel("a").hidden).toBe(false);
    expect(panel("a").querySelector("video")!.getAttribute("src")).toBe("/tutorial/clips/a.mp4");
    expect(panel("a").querySelector(".tut-desc")!.textContent).toBe("Press Run assessment to stamp a decision.");
    toggle("a").click();
    expect(toggle("a").getAttribute("aria-expanded")).toBe("false");
    expect(panel("a").hidden).toBe(true);
  });

  it("opening another topic closes the first and pauses it; reopening does not add a second video", () => {
    mount();
    toggle("a").click();
    const video = panel("a").querySelector("video")!;
    const pause = vi.fn();
    video.pause = pause;
    toggle("b").click();
    expect(panel("a").hidden).toBe(true);
    expect(panel("b").hidden).toBe(false);
    expect(pause).toHaveBeenCalled();
    toggle("a").click();
    expect(panel("a").querySelectorAll("video").length).toBe(1);
  });

  it("the full guide does not download until played, and a missing file shows a message", () => {
    mount();
    const full = document.querySelector<HTMLVideoElement>(".tut-full video")!;
    expect(full.preload).toBe("none");
    expect(full.getAttribute("src")).toBe("/tutorial/full.mp4");
    full.dispatchEvent(new Event("error"));
    expect(document.querySelector(".tut-full .tut-error")!.textContent).toContain("could not be loaded");
  });

  it("search narrows the list, and no match says so", () => {
    mount();
    const search = document.querySelector<HTMLInputElement>("#tutSearch")!;
    search.value = "csv";
    search.dispatchEvent(new Event("input"));
    expect(document.querySelectorAll(".tut-topic").length).toBe(1);
    search.value = "zzz";
    search.dispatchEvent(new Event("input"));
    expect(document.querySelector(".tut-list .empty")!.textContent).toContain("No topics match");
  });
});
