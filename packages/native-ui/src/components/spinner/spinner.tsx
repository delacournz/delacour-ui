import { Children, type ComponentProps, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { cn } from "../../lib/cn";
import { useButtonContext } from "../button/button.context";
import { BUTTON_FOREGROUND_TOKEN, BUTTON_ICON_SIZE } from "../button/button.variants";
import { IconDefaultsProvider, useIconDefaults } from "../icon";
import { type SpinnerContextValue, SpinnerProvider } from "./spinner.context";
import {
	resolveSpinnerColor,
	resolveSpinnerSize,
	type SpinnerColor,
	type SpinnerSize,
	spinnerVariants,
} from "./spinner.variants";
import { SpinnerContent } from "./spinner-content";

const ENTERING = FadeIn.duration(200).easing(Easing.out(Easing.ease));
const EXITING = FadeOut.duration(100);

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
	/** Rotation speed multiplier. 1 is one full turn per 900ms. */
	speed?: number;
	className?: string;
	children?: ReactNode;
};

function SpinnerRoot({
	size,
	color,
	isLoading = true,
	speed = 1,
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
		() => ({ size: resolvedSize, color: resolvedColor, isLoading, speed }),
		[resolvedSize, resolvedColor, isLoading, speed]
	);

	// A glyph composed into the spinner adopts these unless told otherwise.
	const iconContext = useMemo(() => ({ size: resolvedSize, color: colorToken }), [resolvedSize, colorToken]);

	const content = useMemo(() => wrapSpinnerChildren(children), [children]);

	if (!isLoading) return null;

	return (
		<SpinnerProvider value={context}>
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
		</SpinnerProvider>
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
 * rotates, so a custom icon or asset needs nothing but to be passed in.
 *
 * @example
 * <Spinner size="lg" color="success" />
 *
 * @example
 * <Spinner speed={0.7}>
 *   <Icon icon={IconArrowsRepeat} />
 * </Spinner>
 */
export const Spinner = Object.assign(SpinnerRoot, {
	/** The rotating layer. Wraps a custom glyph or asset so it spins; applied automatically. */
	Content: SpinnerContent,
	displayName: "Spinner",
});
