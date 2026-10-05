import { useCallback, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import type Animated from "react-native-reanimated";
import {
	type AnimatedRef,
	type SharedValue,
	scrollTo as scrollToWorklet,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import {
	resolveActiveSection,
	resolveScrollProgress,
	resolveSectionScrollTarget,
	type SectionOffset,
} from "../lib/scroll-sections";

export type UseScrollSectionsOptions = {
	/** Points below the viewport's top where a section counts as entered. Default 0. */
	readingLine?: number;
	/** Whether `scrollTo` animates. Default true. */
	isAnimated?: boolean;
	/** Fires when the reader crosses into a different section. */
	onActiveChange?: (id: string) => void;
};

export type UseScrollSectionsResult = {
	/** Attach to the `Animated.ScrollView` whose sections are tracked. */
	scrollRef: AnimatedRef<Animated.ScrollView>;
	/** Pass as that scroll view's `onScroll`, with `scrollEventThrottle={16}`. */
	scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
	/** `onLayout` for a section's box — a direct child of the scroll content. Stable per id. */
	register: (id: string) => (event: LayoutChangeEvent) => void;
	/** The section being read. React state: changes only when the section does. */
	activeId: string | undefined;
	/** 0–1, how far down the content the reader is. Updated on the UI thread. */
	progress: SharedValue<number>;
	/** The raw scroll offset. */
	scrollY: SharedValue<number>;
	/** Scrolls a section's top onto the reading line and makes it active at once. */
	scrollTo: (id: string) => void;
};

/**
 * Tracks which section of a scroll view the reader is in, and how far down they are, on the
 * UI thread. `SectionProgress` and `SectionRail` read it; any custom table of contents can too.
 *
 * The scroll handler resolves the active section every frame but crosses to React only when it
 * changes, so a scroll costs no renders. A `scrollTo` pins the target as active until the scroll
 * arrives there (or the reader drags), so a jump from the first section to the last does not
 * flick the label through every section in between.
 *
 * Offsets come from each section's `onLayout`, which reports `y` relative to the parent — so a
 * registered section must be a direct child of the scroll content.
 */
export function useScrollSections({
	readingLine = 0,
	isAnimated = true,
	onActiveChange,
}: UseScrollSectionsOptions = {}): UseScrollSectionsResult {
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const sections = useSharedValue<SectionOffset[]>([]);
	const scrollY = useSharedValue(0);
	const progress = useSharedValue(0);
	const lastActive = useSharedValue<string | undefined>(undefined);
	const pinned = useSharedValue<string | undefined>(undefined);
	const [activeId, setActiveId] = useState<string | undefined>(undefined);

	const report = useCallback(
		(id: string) => {
			setActiveId(id);
			onActiveChange?.(id);
		},
		[onActiveChange]
	);

	const scrollHandler = useAnimatedScrollHandler({
		onBeginDrag: () => {
			pinned.value = undefined;
		},
		onScroll: (event) => {
			const y = event.contentOffset.y;
			scrollY.value = y;
			progress.value = resolveScrollProgress(y, event.contentSize.height, event.layoutMeasurement.height);
			const next = resolveActiveSection(sections.value, y, readingLine);
			if (pinned.value !== undefined) {
				if (next !== pinned.value) return;
				pinned.value = undefined;
			}
			if (next !== undefined && next !== lastActive.value) {
				lastActive.value = next;
				scheduleOnRN(report, next);
			}
		},
	});

	const handlers = useRef(new Map<string, (event: LayoutChangeEvent) => void>());
	const register = useCallback(
		(id: string) => {
			const cached = handlers.current.get(id);
			if (cached) return cached;
			const handler = (event: LayoutChangeEvent) => {
				const y = event.nativeEvent.layout.y;
				sections.modify((list) => {
					"worklet";
					const index = list.findIndex((section) => section.id === id);
					if (index === -1) list.push({ id, y });
					else list[index] = { id, y };
					return list;
				});
			};
			handlers.current.set(id, handler);
			return handler;
		},
		[sections]
	);

	const scrollTo = useCallback(
		(id: string) => {
			const section = sections.value.find((candidate) => candidate.id === id);
			if (section === undefined) return;
			const target = resolveSectionScrollTarget(section.y, readingLine);
			pinned.value = id;
			lastActive.value = id;
			report(id);
			scheduleOnUI(() => {
				"worklet";
				scrollToWorklet(scrollRef, 0, target, isAnimated);
			});
		},
		[isAnimated, lastActive, pinned, readingLine, report, scrollRef, sections]
	);

	return { scrollRef, scrollHandler, register, activeId, progress, scrollY, scrollTo };
}
