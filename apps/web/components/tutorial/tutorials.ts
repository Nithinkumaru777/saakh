// Tutorials page: the full guide, then one short clip with a written description per feature.
// Built with the DOM to match saakhRuntime; all text goes through textContent.
import data from "./topics.json";

export interface Topic {
  id: string;
  title: string;
  description: string;
  duration: string;
  src: string;
}
export interface TopicChapter {
  num: number;
  title: string;
  topics: Topic[];
}
export interface TutorialData {
  full: { src: string; poster: string; duration: string };
  chapters: TopicChapter[];
}

export const TUTORIALS: TutorialData = data;

/** Chapters holding topics that match every word of the query, in title or description. Empty chapters are dropped. */
export function filterChapters(chapters: TopicChapter[], query: string): TopicChapter[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return chapters;
  return chapters
    .map((c) => ({
      ...c,
      topics: c.topics.filter((t) => {
        const text = `${c.title} ${t.title} ${t.description}`.toLowerCase();
        return words.every((w) => text.includes(w));
      }),
    }))
    .filter((c) => c.topics.length > 0);
}

const NOT_LOADED = "This video could not be loaded. Please try again later.";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeVideo(src: string, label: string, poster?: string): HTMLElement {
  const wrap = el("div", "tut-video");
  const video = el("video");
  video.controls = true;
  video.preload = poster ? "none" : "metadata";
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-label", label);
  if (poster) video.poster = poster;
  video.addEventListener("error", () => wrap.replaceChildren(el("p", "tut-error", NOT_LOADED)));
  // Only one video plays at a time.
  video.addEventListener("play", () => pauseTutorials(video));
  video.src = src;
  wrap.append(video);
  return wrap;
}

/** Pause every tutorial video, except `keep`. Called when another video starts and when leaving the page. */
export function pauseTutorials(keep?: HTMLVideoElement): void {
  document.querySelectorAll<HTMLVideoElement>(".tut-root video").forEach((v) => {
    if (v !== keep) v.pause();
  });
}

function setOpen(row: HTMLElement, open: boolean): void {
  const toggle = row.querySelector<HTMLButtonElement>(".tut-toggle")!;
  const panel = row.querySelector<HTMLElement>(".tut-panel")!;
  toggle.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
  row.classList.toggle("open", open);
  if (!open) panel.querySelector("video")?.pause();
}

function makeTopic(topic: Topic): HTMLElement {
  const row = el("article", "tut-topic");
  row.dataset.topic = topic.id;
  const toggle = el("button", "tut-toggle ih");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", `tut-panel-${topic.id}`);
  const arrow = el("i", "tut-arrow");
  arrow.dataset.icon = "chevron-right";
  arrow.setAttribute("aria-hidden", "true");
  toggle.append(el("span", "tut-title", topic.title), el("span", "tut-dur", topic.duration), arrow);
  const panel = el("div", "tut-panel");
  panel.id = `tut-panel-${topic.id}`;
  panel.hidden = true;
  toggle.addEventListener("click", () => {
    const opening = toggle.getAttribute("aria-expanded") !== "true";
    if (opening) {
      // One topic open at a time keeps the list short and stops two clips competing.
      document.querySelectorAll<HTMLElement>(".tut-topic.open").forEach((r) => setOpen(r, false));
      pauseTutorials();
      // The clip is only requested when someone actually opens the topic.
      if (!panel.hasChildNodes()) panel.append(makeVideo(topic.src, topic.title), el("p", "tut-desc", topic.description));
    }
    setOpen(row, opening);
  });
  row.append(toggle, panel);
  return row;
}

function renderList(list: HTMLElement, tutorial: TutorialData, query: string, hydrate: (root: ParentNode) => void): void {
  const chapters = filterChapters(tutorial.chapters, query);
  list.replaceChildren();
  if (!chapters.length) {
    list.append(el("p", "empty", "No topics match. Try another word, such as a button or page name."));
    return;
  }
  for (const c of chapters) {
    const section = el("section", "tut-chapter");
    section.append(el("h2", "subtitle", c.title), ...c.topics.map(makeTopic));
    list.append(section);
  }
  hydrate(list);
}

export function renderTutorials(root: HTMLElement, hydrate: (root: ParentNode) => void = () => {}, tutorial: TutorialData = TUTORIALS): void {
  const full = el("section", "panel tut-full");
  full.append(
    makeVideo(tutorial.full.src, "Full guide to Saakh", tutorial.full.poster),
    el("p", "tut-full-cap", `Full guide, ${tutorial.full.duration}. Every feature from start to finish.`),
  );
  const search = el("input", "input tut-search");
  search.type = "search";
  search.id = "tutSearch";
  search.placeholder = "Search topics, such as PDF or CIBIL";
  search.setAttribute("aria-label", "Search tutorial topics");
  const list = el("div", "tut-list");
  search.addEventListener("input", () => {
    pauseTutorials();
    renderList(list, tutorial, search.value, hydrate);
  });
  root.replaceChildren(full, el("h2", "tut-head", "Learn one feature"), search, list);
  renderList(list, tutorial, "", hydrate);
}
