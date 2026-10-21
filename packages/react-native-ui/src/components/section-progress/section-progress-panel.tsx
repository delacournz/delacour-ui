import { type ReactElement, type ReactNode, useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, ScrollView, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolveListOpacity,
	resolveOpenPanelHeight,
	resolvePanelFrame,
	resolvePanelMaxHeight,
	resolvePanelWidth,
	resolvePillSize,
	SECTION_PROGRESS_BORDER,
	SECTION_PROGRESS_DIVIDER,
	SECTION_PROGRESS_ITEM_HEIGHT,
	sectionProgressVariants,
} from "./section-progress.variants";
import { SectionProgressPill } from "./section-progress-pill";

/** Heavily damped: the card settles onto its size without overshooting it. */
const PANEL_SPRING = { damping: 28, mass: 0.6, stiffness: 320 } as const;
/** Closing is quicker than opening — the reader has already chosen. */
const PANEL_CLOSE = { duration: 220, easing: Easing.out(Easing.cubic) } as const;
/** Reduce motion: the size snaps and the list only fades, over this long. */
const PANEL_FADE_MS = 160;
const LIST_MAX_HEIGHT = resolvePanelMaxHeight();

/** A resolved style value as points, or 0 when the class resolved to nothing numeric. */
function points(value: unknown): number {
	return typeof value === "number" ? value : 0;
}

export type SectionProgressPanelProps = {
	/** The `SectionProgress.Item`s. */
	children: ReactNode;
	/** The width the placement leaves between its gutters — the most the card may take. */
	availableWidth: number;
};

/**
 * The one surface the pill and the card share. Closed it is the capsule around the pill's row;
 * opened, the same view grows — width, height and corner together — into the card, so the row the
 * reader tapped never leaves the screen and the ring keeps tracking through the change.
 *
 * The rule and the list sit in a box pinned to the row's far side, outside the surface's layout,
 * so the growing edge reveals them rather than dragging them along. The box is sized explicitly —
 * the rule plus the list's content up to its max — because an absolute box sized by its content is
 * capped at the surface's height, which is the closed pill's when it first lays out. The list fades in over the
 * back of the grow and out over the front of the shrink, so rows never show cramped. Open, the
 * card hugs a short list and stops at six rows, past which the list scrolls.
 *
 * Every size is a shared value written from a measure, and the frame is resolved on the UI thread
 * each frame, so a title's width easing while closed moves the capsule with it in the same frame.
 * Reduce motion: the size snaps and the list only fades.
 *
 * VoiceOver is confined to it while open, and the escape gesture closes it. Closed, the list is
 * hidden from assistive technology and takes no touches.
 */
export function SectionProgressPanel({ availableWidth, children }: SectionProgressPanelProps): ReactElement {
	const { isOpen, placement, setOpen } = useSectionProgressPart("SectionProgress.Panel");
	const isReducedMotion = useReducedMotion();
	const slots = sectionProgressVariants({ placement });
	const isBottom = placement.startsWith("bottom");

	const row = useResolveClassNames(slots.pillRow());
	const ring = useResolveClassNames(slots.ring());
	const corner = useResolveClassNames(slots.panelCorner());
	const chrome =
		points(row.paddingStart ?? row.paddingLeft ?? row.paddingHorizontal ?? row.padding) +
		points(ring.width) +
		points(row.columnGap ?? row.gap) +
		points(row.paddingEnd ?? row.paddingRight ?? row.paddingHorizontal ?? row.padding);
	const openRadius = points(corner.borderRadius);
	const openWidth = resolvePanelWidth(availableWidth);

	const labelWidth = useSharedValue(0);
	const rowHeight = useSharedValue(SECTION_PROGRESS_ITEM_HEIGHT);
	const listHeight = useSharedValue(0);
	const progress = useSharedValue(isOpen ? 1 : 0);
	const fade = useSharedValue(isOpen ? 1 : 0);

	useEffect(() => {
		const target = isOpen ? 1 : 0;
		if (isReducedMotion) {
			progress.value = target;
			fade.value = withTiming(target, { duration: PANEL_FADE_MS });
		} else {
			progress.value = isOpen ? withSpring(target, PANEL_SPRING) : withTiming(target, PANEL_CLOSE);
			fade.value = target;
		}
	}, [fade, isOpen, isReducedMotion, progress]);

	// The row's height is a shared value for the frame and React state for the list box's offset:
	// an animated style never drops a key it once set, so a box moved from `top` to `bottom` by a
	// placement change would keep both. It changes only with the type size.
	const [rowExtent, setRowExtent] = useState(SECTION_PROGRESS_ITEM_HEIGHT);
	const measureRow = useCallback(
		(event: LayoutChangeEvent) => {
			const { height } = event.nativeEvent.layout;
			rowHeight.value = height;
			setRowExtent(height);
		},
		[rowHeight]
	);
	const measureList = useCallback(
		(_width: number, height: number) => {
			listHeight.value = height;
		},
		[listHeight]
	);
	const close = useCallback(() => setOpen(false), [setOpen]);

	const surfaceStyle = useAnimatedStyle(() => {
		const pill = resolvePillSize(chrome, labelWidth.value, rowHeight.value);
		const frame = resolvePanelFrame(
			{ width: pill.width, height: pill.height, radius: pill.height / 2 },
			{
				width: openWidth,
				height: resolveOpenPanelHeight(rowHeight.value, listHeight.value, LIST_MAX_HEIGHT),
				radius: openRadius,
			},
			progress.value
		);
		return { width: frame.width, height: frame.height, borderRadius: frame.radius };
	});
	const listBoxStyle = useAnimatedStyle(() => ({
		height: SECTION_PROGRESS_DIVIDER + Math.min(listHeight.value, LIST_MAX_HEIGHT),
		opacity: isReducedMotion ? fade.value : resolveListOpacity(progress.value),
	}));

	const list = (
		<ScrollView
			bounces={false}
			contentContainerClassName={slots.list()}
			className="flex-1"
			onContentSizeChange={measureList}
		>
			{children}
		</ScrollView>
	);
	const divider = <View className={slots.divider()} />;

	return (
		<Animated.View
			accessibilityViewIsModal={isOpen}
			className={slots.panel()}
			onAccessibilityEscape={isOpen ? close : undefined}
			style={surfaceStyle}
		>
			<SectionProgressPill labelWidth={labelWidth} onLayout={measureRow} />
			<Animated.View
				accessibilityElementsHidden={!isOpen}
				className={slots.listBox()}
				importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
				pointerEvents={isOpen ? "auto" : "none"}
				style={[
					{ width: openWidth - SECTION_PROGRESS_BORDER * 2 },
					isBottom ? { bottom: rowExtent } : { top: rowExtent },
					listBoxStyle,
				]}
			>
				{isBottom ? list : divider}
				{isBottom ? divider : list}
			</Animated.View>
		</Animated.View>
	);
}
SectionProgressPanel.displayName = "DelacourUI.SectionProgress.Panel";
