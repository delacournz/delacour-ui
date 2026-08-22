import {
	Children,
	type ComponentProps,
	createContext,
	isValidElement,
	type ReactElement,
	type ReactNode,
	use,
	useEffect,
	useId,
	useMemo,
} from "react";
import Animated, {
	cancelAnimation,
	Easing,
	FadeIn,
	FadeOut,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { cn } from "../../lib/cn";
import { useButtonContext } from "../button/button.context";
import { BUTTON_FOREGROUND_TOKEN, BUTTON_ICON_SIZE } from "../button/button.variants";
import { IconDefaultsProvider, useIconDefaults } from "../icon";
import {
	resolveSpinnerColor,
	resolveSpinnerSize,
	SPINNER_DURATION_MS,
	type SpinnerColor,
	type SpinnerSize,
	spinnerContentVariants,
	spinnerVariants,
} from "./spinner.variants";

const ENTERING = FadeIn.duration(200).easing(Easing.out(Easing.ease));
const EXITING = FadeOut.duration(100);

type SpinnerContextValue = {
	/** Resolved edge length in points. */
	size: number;
	/** Resolved colour value, ready for an SVG stroke. */
	color: string | undefined;
	/** Whether the spinner is showing. */
	isLoading: boolean;
};

const SpinnerContext = createContext<SpinnerContextValue | null>(null);

/**
 * Reads the enclosing spinner's resolved size and colour.
 *
 * Lets a custom glyph match the spinner without the size and colour being
 * passed down to it.
 */
export function useSpinner(): SpinnerContextValue {
	const context = use(SpinnerContext);
	if (!context) {
		throw new Error("useSpinner must be called inside a <Spinner>.");
	}
	return context;
}

export type SpinnerProps = Omit<ComponentProps<typeof Animated.View>, "children" | "style"> & {
	/** A named size, or an edge length in points. Defaults to the enclosing component's icon size. */
	size?: SpinnerSize | number;
	/**
	 * A named colour, any theme token the active theme defines
	 * (`primary-foreground`, `muted-foreground`) or a literal (`#EC4899`).
	 * Defaults to the enclosing component's icon colour.
	 */
	color?: SpinnerColor | (string & {});
	/** Whether the spinner is shown. Fades out when flipped off. */
	isLoading?: boolean;
	className?: string;
	children?: ReactNode;
};

/**
 * An animated loading indicator, composed from parts rather than configured by
 * flags.
 *
 * Size and colour are inherited, not passed. Inside a `Button` the spinner
 * reads that button's context and comes out at its icon size in its variant's
 * foreground; elsewhere it falls back to the nearest `IconDefaultsProvider`,
 * then to `md` on `foreground`. An explicit `size` or `color` always wins.
 *
 * Any child becomes the glyph and is wrapped in a `Spinner.Content` so it still
 * rotates; pass `Spinner.Content` yourself to control the rotation.
 *
 * @example
 * <Spinner size="lg" color="success" />
 *
 * @example
 * <Spinner>
 *   <Spinner.Content speed={0.7}>
 *     <Icon icon={IconArrowsRepeat} />
 *   </Spinner.Content>
 * </Spinner>
 */
export function Spinner({
	size,
	color,
	isLoading = true,
	className,
	children,
	...props
}: SpinnerProps): ReactElement | null {
	const button = useButtonContext();
	const iconDefaults = useIconDefaults();

	const inheritedSize = button ? BUTTON_ICON_SIZE[button.size] : iconDefaults?.size;
	const inheritedColor = button ? BUTTON_FOREGROUND_TOKEN[button.variant] : iconDefaults?.color;

	const resolvedSize = resolveSpinnerSize(size, inheritedSize);
	const colorToken = resolveSpinnerColor(color, inheritedColor);
	const resolvedColor = useThemeColor(colorToken);

	const context = useMemo<SpinnerContextValue>(
		() => ({ size: resolvedSize, color: resolvedColor, isLoading }),
		[resolvedSize, resolvedColor, isLoading]
	);

	// A glyph composed into the spinner adopts these unless told otherwise.
	const iconContext = useMemo(() => ({ size: resolvedSize, color: colorToken }), [resolvedSize, colorToken]);

	const content = useMemo(() => wrapSpinnerChildren(children), [children]);

	if (!isLoading) return null;

	return (
		<SpinnerContext value={context}>
			<Animated.View
				accessibilityRole="progressbar"
				accessibilityState={{ busy: true }}
				className={cn(spinnerVariants(), className)}
				entering={ENTERING}
				exiting={EXITING}
				style={{ height: resolvedSize, width: resolvedSize }}
				{...props}
			>
				<IconDefaultsProvider value={iconContext}>{content}</IconDefaultsProvider>
			</Animated.View>
		</SpinnerContext>
	);
}

/**
 * Wraps a bare glyph in a `Spinner.Content` so it rotates.
 *
 * Without this, `<Spinner><Icon … /></Spinner>` would render a motionless icon:
 * the rotation lives on `Spinner.Content`, not on the root. A caller who passes
 * `Spinner.Content` themselves is left alone, since they own the rotation.
 */
function wrapSpinnerChildren(children: ReactNode): ReactNode {
	if (children === undefined || children === null) return <SpinnerContent />;

	const items = Children.toArray(children);
	const hasContent = items.some((child) => isValidElement(child) && child.type === SpinnerContent);

	return hasContent ? children : <SpinnerContent>{children}</SpinnerContent>;
}

export type SpinnerContentProps = Omit<ComponentProps<typeof Animated.View>, "children"> & {
	/** Rotation speed multiplier. 1 is one full turn per 900ms. */
	speed?: number;
	className?: string;
	children?: ReactNode;
};

/**
 * The rotating part of a spinner.
 *
 * Rendered automatically around whatever the spinner is given, so it is only
 * written out by hand to set a `speed` or to style the rotating layer.
 */
function SpinnerContent({ speed = 1, className, style, children, ...props }: SpinnerContentProps): ReactElement {
	const { color, size } = useSpinner();
	const angle = useSharedValue(0);

	useEffect(() => {
		angle.value = withRepeat(
			withTiming(360, {
				duration: SPINNER_DURATION_MS / speed,
				easing: Easing.linear,
				// Deliberate. Under the default `System` policy `withTiming` completes
				// instantly while the OS reduce-motion setting is on, so `withRepeat(-1)`
				// would spin a zero-length animation forever. A status indicator is not
				// decorative motion — it is the only thing saying work is in flight.
				reduceMotion: ReduceMotion.Never,
			}),
			-1,
			false
		);

		// Without this the repeat outlives the unmount when a button stops loading.
		return () => cancelAnimation(angle);
	}, [angle, speed]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${angle.value}deg` }],
	}));

	return (
		<Animated.View className={cn(spinnerContentVariants(), className)} style={[animatedStyle, style]} {...props}>
			{children ?? <SpinnerArc color={color} size={size} />}
		</Animated.View>
	);
}

type SpinnerArcProps = {
	size?: number;
	color?: string;
};

/**
 * The default glyph: a ring whose stroke fades from opaque to transparent
 * around the circle.
 *
 * Drawn as two half-rings because a linear gradient only fades along one axis —
 * one alone cannot carry the stroke all the way round. Central Icons has no
 * loader glyph, so this is drawn from SVG primitives rather than imported.
 *
 * The viewBox is fixed at 24 and only `width`/`height` change, so the stroke
 * stays proportional at every size with no geometry to recompute.
 */
function SpinnerArc({ size, color }: SpinnerArcProps): ReactElement {
	const spinner = use(SpinnerContext);
	const resolvedSize = size ?? spinner?.size;
	const resolvedColor = color ?? spinner?.color;

	// An SVG gradient is referenced by id, and ids are global to the document.
	// React 19 emits `«r1»`-style ids, whose delimiters are invalid in `url(#…)`.
	const id = useId().replace(/[^a-zA-Z0-9]/g, "");
	const leadId = `spinner-lead-${id}`;
	const tailId = `spinner-tail-${id}`;

	return (
		<Svg fill="none" height={resolvedSize} viewBox="0 0 24 24" width={resolvedSize}>
			<Defs>
				<LinearGradient id={leadId} x1="0" x2="0" y1="0" y2="1">
					<Stop offset="0" stopColor={resolvedColor} stopOpacity={1} />
					<Stop offset="1" stopColor={resolvedColor} stopOpacity={0.55} />
				</LinearGradient>
				<LinearGradient id={tailId} x1="0" x2="0" y1="0" y2="1">
					<Stop offset="0" stopColor={resolvedColor} stopOpacity={0} />
					<Stop offset="1" stopColor={resolvedColor} stopOpacity={0.55} />
				</LinearGradient>
			</Defs>
			<Path d="M 12 2 A 10 10 0 0 1 12 22" stroke={`url(#${leadId})`} strokeLinecap="round" strokeWidth={2.5} />
			<Path d="M 12 22 A 10 10 0 0 1 12 2" stroke={`url(#${tailId})`} strokeLinecap="round" strokeWidth={2.5} />
		</Svg>
	);
}

Spinner.Content = SpinnerContent;
