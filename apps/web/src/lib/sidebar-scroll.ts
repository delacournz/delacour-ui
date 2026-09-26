import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * The docs sidebar's scroll offset, kept by us rather than left to the router.
 *
 * TanStack's scroll restoration finds a scrolled element again by an
 * `nth-child` path from `<html>` unless it carries `data-scroll-restoration-id`,
 * and Fumadocs gives its sidebar viewport no way to pass one. Anything that
 * shifts that path, remounts the layout or reloads the page drops the offset,
 * and the sidebar jumps back to the top on every click. Holding the offset in
 * `sessionStorage` and restoring it after each navigation survives all three.
 */
const STORAGE_KEY = "delacour:sidebar-scroll";

/** Base UI's `ScrollArea.Viewport` inside Fumadocs' desktop sidebar. */
const VIEWPORT = '#nd-sidebar [data-id$="-viewport"]';

const ACTIVE_ITEM = '[data-active="true"]';

type Span = { top: number; bottom: number };

/** A stored offset, or `null` when there is nothing worth restoring. */
export function parseScrollTop(raw: string | null): number | null {
	if (!raw) return null;
	const value = Number(raw);
	return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Whether `item` sits entirely inside `viewport`, vertically. */
export function isWithin(item: Span, viewport: Span): boolean {
	return item.top >= viewport.top && item.bottom <= viewport.bottom;
}

function read(): number | null {
	try {
		return parseScrollTop(sessionStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

function write(value: number) {
	try {
		sessionStorage.setItem(STORAGE_KEY, String(Math.round(value)));
	} catch {}
}

/**
 * Put the sidebar back where it was, then make sure the active item is still
 * on screen — a page reached from search can be far from where it was left.
 */
function restore(saved: number | null) {
	const viewport = document.querySelector<HTMLElement>(VIEWPORT);
	if (!viewport) return;

	if (saved !== null) viewport.scrollTop = saved;

	// The first match is the collapsed tab switcher's hidden, zero-size link.
	const active = [...viewport.querySelectorAll<HTMLElement>(ACTIVE_ITEM)].find((el) => el.offsetHeight > 0);
	if (!active) return;

	const item = active.getBoundingClientRect();
	const frame = viewport.getBoundingClientRect();
	if (isWithin(item, frame)) return;

	// Only the viewport moves — `scrollIntoView` would scroll the window too.
	viewport.scrollTop += item.top < frame.top ? item.top - frame.top : item.bottom - frame.bottom;
}

/**
 * Keep the docs sidebar's scroll offset across navigations and reloads.
 *
 * The offset is snapshotted when a navigation starts and saving pauses until it
 * has rendered: a reset to the top in between fires a scroll event that would
 * otherwise save `0` over it. `onRendered` runs after the router's own scroll
 * restoration, and the second pass on the next frame lands after anything that
 * scrolls later still. The listener is delegated from `document` so a
 * remounted sidebar is still heard.
 */
export function useSidebarScrollMemory() {
	const router = useRouter();

	useEffect(() => {
		let snapshot: number | null = null;
		let navigating = false;
		let frame = 0;

		const onScroll = (event: Event) => {
			if (navigating) return;
			if (event.target instanceof HTMLElement && event.target.matches(VIEWPORT)) write(event.target.scrollTop);
		};

		const settle = (saved: number | null) => {
			restore(saved);
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				restore(saved);
				navigating = false;
			});
		};

		const offBefore = router.subscribe("onBeforeNavigate", () => {
			if (!navigating) snapshot = read();
			navigating = true;
		});
		const offRendered = router.subscribe("onRendered", () => settle(snapshot ?? read()));

		document.addEventListener("scroll", onScroll, { capture: true, passive: true });
		settle(read());

		return () => {
			offBefore();
			offRendered();
			cancelAnimationFrame(frame);
			document.removeEventListener("scroll", onScroll, { capture: true });
		};
	}, [router]);
}
