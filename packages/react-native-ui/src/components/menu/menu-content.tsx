import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { I18nManager, Modal, ScrollView, useWindowDimensions, View, type ViewProps } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Pressable } from "../pressable";
import { useMenuPart } from "./menu.context";
import {
	MENU_DEFAULT_OFFSET,
	MENU_EDGE_MARGIN,
	MENU_ENTER_SCALE,
	MENU_MOTION,
	type MenuAlign,
	type MenuAnchorRect,
	type MenuPlacement,
	type MenuPlacementResult,
	menuVariants,
	resolveMenuOrigin,
	resolveMenuPhysicalAlign,
	resolveMenuPlacement,
	resolveMenuWidth,
} from "./menu.variants";
import { MenuBackground } from "./menu-background";

export type MenuContentProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;
	/** The side it prefers. Default `bottom`; flips when there is no room. */
	placement?: MenuPlacement;
	/** Which edge lines up with the anchor's. Default `start`; swaps under RTL. */
	align?: MenuAlign;
	/** Gap from the anchor, in points. Default 6. */
	offset?: number;
	/** Panel width. Default: the trigger's width, at least 200. */
	width?: number;
	minWidth?: number;
	/** Cap on the panel's height. Default: the room inside the safe area. */
	maxHeight?: number;
	/** Scroll rows past the cap. Default `true`; `false` clips instead. */
	isScrollable?: boolean;
	/** Tint the screen behind the panel. Default `false`. */
	hasScrim?: boolean;
	/** Anchor to this rect instead of the trigger. A zero-size rect is a point. */
	anchor?: MenuAnchorRect;
};

/**
 * The panel: a transparent `Modal` holding an anchored, scrolling list of rows.
 *
 * **The `Modal` is the layer.** It sits above everything, routes Android's back
 * button to `onRequestClose`, and contains a screen reader — with no new
 * dependency. A transparent full-screen pressable behind the panel closes it on
 * an outside tap.
 *
 * **It measures, then places, then shows.** The first frame renders at opacity
 * 0; once the rows report their height, `resolveMenuPlacement` picks the side,
 * and the enter runs from there — so the panel never jumps. The side is then
 * locked for the visit: a submenu expanding later grows the panel away from the
 * anchor (a panel above is positioned by its bottom edge) and scrolls past the
 * cap rather than flipping under the finger.
 *
 * **Enter is 160ms, exit 120ms**: opacity with a 0.96 scale from the anchor's
 * side, approximated with a translate. Under reduced motion, opacity alone. The
 * `Modal` unmounts when the exit finishes.
 *
 * A caller's `Menu.Background` child is lifted out and drawn behind the
 * scroller in place of the default one.
 */
export function MenuContent({
	children,
	className,
	placement = "bottom",
	align = "start",
	offset = MENU_DEFAULT_OFFSET,
	width,
	minWidth,
	maxHeight: maxHeightProp,
	isScrollable = true,
	hasScrim = false,
	anchor: anchorProp,
	...props
}: MenuContentProps): ReactElement | null {
	const { anchor: contextAnchor, close, isOpen } = useMenuPart("Menu.Content");
	const anchor = anchorProp ?? contextAnchor;
	const window = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const isReducedMotion = useReducedMotion();
	const slots = menuVariants();

	// Adjusted during render, so the Modal mounts in the commit that opened it.
	const [isPresent, setPresent] = useState(isOpen);
	if (isOpen && !isPresent) setPresent(true);

	const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
	const [locked, setLocked] = useState<MenuPlacementResult | null>(null);

	const { background, rows } = useMemo(() => splitBackground(children), [children]);

	const resolvedWidth = resolveMenuWidth({
		maxWidth: window.width - insets.left - insets.right - MENU_EDGE_MARGIN * 2,
		minWidth,
		triggerWidth: anchor?.width ?? 0,
		width,
	});

	const resolve = useCallback(
		(height: number) =>
			anchor
				? resolveMenuPlacement({
						align,
						anchor,
						content: { height, width: resolvedWidth },
						insets,
						isRTL: I18nManager.isRTL,
						offset,
						placement,
						window: { height: window.height, width: window.width },
					})
				: null,
		[align, anchor, insets, offset, placement, resolvedWidth, window.height, window.width]
	);

	// Placed once per visit, from the first measurement taken with an anchor.
	useEffect(() => {
		if (!isOpen || locked || measuredHeight === null) return;
		const result = resolve(measuredHeight);
		if (result) setLocked(result);
	}, [isOpen, locked, measuredHeight, resolve]);

	const handleContentSize = useCallback((_width: number, height: number) => setMeasuredHeight(height), []);

	const handleExited = useCallback(() => {
		setPresent(false);
		setLocked(null);
		setMeasuredHeight(null);
	}, []);

	const progress = useSharedValue(0);

	useEffect(() => {
		if (isOpen) {
			if (!locked) return;
			progress.value = withTiming(1, { duration: MENU_MOTION.enterMs });
			return;
		}
		if (!isPresent) return;
		progress.value = withTiming(0, { duration: MENU_MOTION.exitMs }, (isFinished) => {
			"worklet";
			if (isFinished) scheduleOnRN(handleExited);
		});
	}, [handleExited, isOpen, isPresent, locked, progress]);

	const { cap, origin, position } = resolvePanelFrame({
		align,
		maxHeight: maxHeightProp,
		measuredHeight,
		placed: locked ?? resolve(measuredHeight ?? 0),
		placement,
		width: resolvedWidth,
		windowHeight: window.height,
	});
	const originX = origin.x;
	const originY = origin.y;
	const enterScale = MENU_ENTER_SCALE;

	const panelStyle = useAnimatedStyle(() => {
		const p = progress.value;
		if (isReducedMotion) return { opacity: p, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] };
		return {
			opacity: p,
			transform: [
				{ translateX: originX * (1 - p) },
				{ translateY: originY * (1 - p) },
				{ scale: enterScale + (1 - enterScale) * p },
			],
		};
	});
	const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

	if (!isPresent) return null;

	return (
		<Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible>
			<GestureHandlerRootView style={fill}>
				<Pressable
					accessibilityLabel="Close menu"
					className="absolute inset-0"
					feedback="none"
					importantForAccessibility="no"
					onPress={close}
				>
					{hasScrim ? <Animated.View className={slots.scrim()} style={scrimStyle} /> : null}
				</Pressable>
				<Animated.View
					accessibilityRole="menu"
					accessibilityViewIsModal
					className={slots.panel()}
					pointerEvents={locked ? "auto" : "none"}
					style={[position, panelStyle]}
					{...props}
				>
					<View className={slots.content({ className })}>
						{background ?? <MenuBackground />}
						<ScrollView
							bounces={false}
							contentContainerClassName={slots.scroll()}
							onContentSizeChange={handleContentSize}
							scrollEnabled={isScrollable}
							showsVerticalScrollIndicator
							style={{ flexGrow: 0, maxHeight: cap }}
						>
							{rows}
						</ScrollView>
					</View>
				</Animated.View>
			</GestureHandlerRootView>
		</Modal>
	);
}
MenuContent.displayName = "DelacourUI.Menu.Content";

const fill = { flex: 1 };

type PanelFrameInput = {
	align: MenuAlign;
	maxHeight: number | undefined;
	measuredHeight: number | null;
	placed: MenuPlacementResult | null;
	placement: MenuPlacement;
	width: number;
	windowHeight: number;
};

/** The panel's height cap, its absolute position, and the side its enter grows from. */
function resolvePanelFrame({
	align,
	maxHeight,
	measuredHeight,
	placed,
	placement,
	width,
	windowHeight,
}: PanelFrameInput): {
	cap: number;
	origin: { x: number; y: number };
	position: { top?: number; bottom?: number; left: number; width: number };
} {
	const cap = Math.min(maxHeight ?? Number.POSITIVE_INFINITY, placed?.maxHeight ?? windowHeight);
	const origin = resolveMenuOrigin({
		align: resolveMenuPhysicalAlign(align, I18nManager.isRTL),
		height: Math.min(measuredHeight ?? 0, cap),
		placement: placed?.placement ?? placement,
		width,
	});
	const position =
		placed?.placement === "top"
			? { bottom: placed.bottom, left: placed.left, width }
			: { left: placed?.left ?? 0, top: placed?.top ?? 0, width };
	return { cap, origin, position };
}

/** Lifts a caller's `Menu.Background` out of the rows, so it is drawn behind the scroller. */
function splitBackground(children: ReactNode): { background: ReactElement | null; rows: ReactNode[] } {
	let background: ReactElement | null = null;
	const rows: ReactNode[] = [];

	for (const child of Children.toArray(children)) {
		if (isValidElement(child) && child.type === MenuBackground) {
			background = child;
			continue;
		}
		rows.push(child);
	}

	return { background, rows };
}
