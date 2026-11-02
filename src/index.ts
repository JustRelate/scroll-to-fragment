import type * as History from "history";

interface Options {
  getElement?: (fragmentId: string) => Element | null | undefined;
  history?: History.History;
  scrollIntoView?: (element: Element) => void;
}

export function scrollToFragment(options: Options = {}) {
  stopScrollToFragment();

  getElement = options.getElement || getElementById;
  history = options.history;
  scrollIntoView = options.scrollIntoView || defaultScrollIntoView;

  startScrollToFragment();
}

function startScrollToFragment() {
  documentObserver = new MutationObserver(handleDomMutation);
  addEventListener("click", handleDocumentClick);
  unlistenHistory = history?.listen(handleHistoryPush);
  startObserving();
}

export function stopScrollToFragment() {
  stopObserving();
  removeEventListener("click", handleDocumentClick);
  if (unlistenHistory) unlistenHistory();
  unlistenHistory = undefined;
  documentObserver = undefined;
}

function startObserving() {
  stopObserving();
  if (!getLocation().hash) return;

  STOP_EVENTS.forEach(addStopListener);
  documentObserver?.observe(document, OBSERVER_CONFIG);
  adjustScrollPosition();

  observeTimeout = setTimeout(stopObserving, OBSERVE_TIMEOUT_MS);
}

function stopObserving() {
  clearTimeout(observeTimeout);
  cancelAnimationFrame(throttleRequestId);
  documentObserver?.disconnect();
  STOP_EVENTS.forEach(removeStopListener);
}

function addStopListener(eventName: string) {
  document.addEventListener(eventName, stopObserving);
}

function removeStopListener(eventName: string) {
  document.removeEventListener(eventName, stopObserving);
}

function handleHistoryPush(update: History.Update): void; // history version 5
function handleHistoryPush(
  location: History.Location,
  action: History.Action,
): void; // history version 4
function handleHistoryPush(
  update: History.Update | History.Location,
  action?: History.Action,
) {
  if ("PUSH" === ("action" in update ? update.action : action)) {
    startObserving();
  }
}

function handleDocumentClick(event: Event) {
  if (event.defaultPrevented) return;

  const anchor = closestAIncludingSelf(event.target as HTMLElement);
  if (!anchor || !anchor.hash) return;
  if (anchor.pathname === getLocation().pathname) throttle(startObserving);
}

function closestAIncludingSelf(element?: HTMLElement) {
  let target: HTMLElement | null | undefined = element;
  while (target && target.nodeName !== "A") target = target.parentElement;
  return target as HTMLAnchorElement | void;
}

function handleDomMutation() {
  throttle(adjustScrollPosition);
}

function adjustScrollPosition() {
  const hash = getLocation().hash;
  if (!hash) return;

  const fragmentId = decodeURIComponent(hash.substring(1));
  const element = getElement.call(null, fragmentId);
  if (element) scrollIntoView.call(null, element);
}

function getLocation() {
  return history?.location || location;
}

function getElementById(id: string) {
  return document.getElementById(id);
}

function defaultScrollIntoView(element: Element) {
  element.scrollIntoView();
}

function throttle(callback: () => void) {
  cancelAnimationFrame(throttleRequestId);
  throttleRequestId = requestAnimationFrame(callback);
}

let getElement: NonNullable<Options["getElement"]>;
let history: Options["history"];
let scrollIntoView: NonNullable<Options["scrollIntoView"]>;

let unlistenHistory: (() => void) | undefined;
let documentObserver: MutationObserver | undefined;
let observeTimeout: ReturnType<typeof setTimeout> | undefined;
let throttleRequestId = 0;

const OBSERVER_CONFIG = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

const OBSERVE_TIMEOUT_MS = 10000;
const STOP_EVENTS = ["selectstart", "touchend", "wheel"];
