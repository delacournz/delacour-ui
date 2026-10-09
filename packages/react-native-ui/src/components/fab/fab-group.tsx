import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { BackHandler, View, type ViewProps } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Icon, type IconComponent } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { FabActionItemProvider, type FabGroupContextValue, FabGroupProvider } from "./fab.context";
import type { FabSharedProps } from "./fab.types";
import {
	FAB_DEFAULT_OFFSET,
	FAB_FOREGROUND_TOKEN,
	FAB_OPEN_ROTATION_DEG,
	FAB_REDUCED_MOTION_MS,
	type FabPlacement,
	fabVariants,
	resolveFabPlacementStyle,
	resolveLabelSide,
} from "./fab.variants";

/** One spring for the whole dial, with a little overshoot so it lands rather than stops. */
const DIAL_SPRING = { damping: 16, stiffness: 220, mass: 0.8 } as const;

export type FabGroupProps = Omit<ViewProps, "children"> &
	FabSharedProps & {
		/** `Fab.Action`s, written top to bottom as they appear above the trigger. */
		children: ReactNode;
		/** The trigger's glyph. Turns 45° as the dial opens — a plus becomes a cross. */
		icon: IconComponent;
		/** Extends the trigger with this text while the dial is closed. */
		label?: string;
		isOpen?: boolean;
		defaultOpen?: boolean;
		onOpenChange?: (isOpen: boolean) => void;
		/** Default `bottom-end`. A group is always pinned. */
		placement?: FabPlacement;
		/** Turn the glyph 45° as the dial opens. Default `true`. */
		isRotatedOnOpen?: boolean;
		/** Lands on the trigger, the one element a test or a flow presses. */
		testID?: string;
		/** Required: the trigger is a glyph, and the dial it opens needs a name. */
		accessibilityLabel: string;
		className?: string;
	};

/**
 * A trigger that unfolds a dial of related actions, over a scrim.
 *
 * Renders a layer covering its parent — the scrim and the pinned dial — so it
 * must be written in the screen's root container, as a sibling of the content
 * it floats over. Nested inside a scroll view's content, the scrim would cover
 * the content box rather than the screen.
 *
 * One spring drives the dial. Each action reads its own window of it, so
 * closing halfway through opening runs the same cascade backwards. Actions are
 * unmounted once the close settles, so a screen reader can never walk into a
 * button nobody can see.
 */
export function FabGroup({
	children,
	icon,
	label,
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	placement = "bottom-end",
	offset = FAB_DEFAULT_OFFSET,
	isSafeAreaAware = true,
	size = "md",
	variant = "primary",
	isDisabled = false,
	haptic = false,
	isRotatedOnOpen = true,
	accessibilityLabel,
	className,
	testID,
	...props
}: FabGroupProps): ReactElement {
	const [isOpen, setIsOpen] = useControllableState({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});
	const isReducedMotion = useReducedMotion();
	const insets = use(SafeAreaInsetsContext);
	const progress = useSharedValue(isOpen ? 1 : 0);
	const [isMounted, setIsMounted] = useState(isOpen);

	// Mount before the open spring starts, in the same render that opened it,
	// so the first frame of the dial already has its actions.
	if (isOpen && !isMounted) setIsMounted(true);

	useEffect(() => {
		const target = isOpen ? 1 : 0;
		const onSettled = (isFinished?: boolean) => {
			"worklet";
			if (isFinished && target === 0) scheduleOnRN(setIsMounted, false);
		};
		progress.value = isReducedMotion
			? withTiming(target, { duration: FAB_REDUCED_MOTION_MS }, onSettled)
			: withSpring(target, DIAL_SPRING, onSettled);
	}, [isOpen, isReducedMotion, progress]);

	useEffect(() => {
		if (!isOpen) return;
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setIsOpen(false);
			return true;
		});
		return () => subscription.remove();
	}, [isOpen, setIsOpen]);

	const actions = Children.toArray(children).filter(isValidElement);
	const count = actions.length;
	const labelSide = resolveLabelSide(placement);

	const close = useCallback(() => setIsOpen(false), [setIsOpen]);
	const toggle = () => setIsOpen(!isOpen);

	const context = useMemo<FabGroupContextValue>(
		() => ({ progress, isOpen, count, labelSide, size, haptic, isReducedMotion, close }),
		[progress, isOpen, count, labelSide, size, haptic, isReducedMotion, close]
	);

	const isExtended = label !== undefined && !isOpen;
	const slots = fabVariants({ size, variant, isExtended, isDisabled, labelSide });

	const scrimStyle = useAnimatedStyle(() => {
		const value = progress.value;
		return { opacity: value < 0 ? 0 : value > 1 ? 1 : value };
	});

	const glyphStyle = useAnimatedStyle(() => {
		const value = progress.value;
		const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
		return { transform: [{ rotate: `${isRotatedOnOpen ? clamped * FAB_OPEN_ROTATION_DEG : 0}deg` }] };
	});

	const anchorStyle = resolveFabPlacementStyle({
		placement,
		offset,
		insetBottom: isSafeAreaAware ? (insets?.bottom ?? 0) : 0,
	});

	// Written top to bottom, but the action nearest the trigger leads the
	// cascade — so the last child is index 0.
	const dial = isMounted
		? actions.map((action, position) => (
				<FabActionItemProvider key={action.key ?? position} value={{ index: count - 1 - position }}>
					{action}
				</FabActionItemProvider>
			))
		: null;

	return (
		<FabGroupProvider value={context}>
			<View accessibilityViewIsModal={isOpen} className="absolute inset-0" pointerEvents="box-none">
				{isMounted ? (
					<Animated.View className={slots.scrim()} style={scrimStyle}>
						<Pressable
							accessibilityLabel="Close"
							accessibilityRole="button"
							className="flex-1"
							feedback="none"
							onPress={close}
						/>
					</Animated.View>
				) : null}
				<View className={slots.dial({ className })} pointerEvents="box-none" style={anchorStyle} {...props}>
					{dial}
					<Pressable
						accessibilityLabel={accessibilityLabel}
						accessibilityRole="button"
						accessibilityState={{ expanded: isOpen }}
						className={slots.root()}
						disabled={isDisabled}
						feedback="scale"
						haptic={haptic}
						onPress={toggle}
						testID={testID}
					>
						<Animated.View style={glyphStyle}>
							<Icon className={slots.icon()} color={FAB_FOREGROUND_TOKEN[variant]} icon={icon} />
						</Animated.View>
						{isExtended ? (
							<Text className={slots.label()} numberOfLines={1}>
								{label}
							</Text>
						) : null}
					</Pressable>
				</View>
			</View>
		</FabGroupProvider>
	);
}
FabGroup.displayName = "DelacourUI.Fab.Group";
