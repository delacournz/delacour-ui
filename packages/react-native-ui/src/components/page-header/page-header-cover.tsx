import { LinearGradient } from "expo-linear-gradient";
import { type ReactElement, type ReactNode, useLayoutEffect } from "react";
import { Image, type ImageProps, type ImageSourcePropType, StyleSheet, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/use-theme-color";
import { cn } from "../../lib/cn";
import { useScreenContext } from "../screen/screen.context";
import { resolveScrollTopInset } from "../screen/screen.variants";
import { usePageHeaderCoverRegistry, usePageHeaderPart } from "./page-header.context";
import { resolvePageHeaderCoverStops } from "./page-header.utils";
import {
	PAGE_HEADER_COVER_HEIGHT,
	pageHeaderVariants,
	resolvePageHeaderCoverHeight,
	resolvePageHeaderCoverOffset,
} from "./page-header.variants";

/** `primary` fading into the page. */
const DEFAULT_COVER_COLORS = ["primary", "background"] as const;

/** A picture or a gradient — never both, so the type says which is drawn. */
type PageHeaderCoverPaint =
	| {
			/** A picture. Drawn with React Native's `Image`, `resizeMode="cover"`, over the default gradient. */
			source: ImageSourcePropType;
			colors?: never;
	  }
	| {
			source?: undefined;
			/** Two to four theme colour tokens or literals. Default: `primary` fading into the page. */
			colors?:
				| readonly [string, string]
				| readonly [string, string, string]
				| readonly [string, string, string, string];
	  };

export type PageHeaderCoverProps = Omit<ViewProps, "children"> &
	PageHeaderCoverPaint & {
		/** Content height in points, excluding any top inset the cover extends under. Default 128. */
		height?: number;
		/**
		 * `page` only: extend under the status bar — and an overlay navbar, inside a `Screen` — so
		 * the cover never stops short of the top edge. Default true.
		 */
		isInsetAware?: boolean;
		/** Alt text. Absent, the cover is decorative and hidden from assistive technology. */
		accessibilityLabel?: string;
		/** Passed to the `Image`. */
		imageProps?: Omit<ImageProps, "source" | "onError">;
		/** Fires when the picture fails; the gradient underneath is already showing. */
		onError?: ImageProps["onError"];
		className?: string;
		/** Overlay — a back button pinned to a corner. Positioned by the caller, inside the content height. */
		children?: ReactNode;
	};

/**
 * A picture or a gradient across the top of the header.
 *
 * **The gradient is always painted; the picture goes over it** — the rule
 * `Avatar` follows — so a slow or dead URL shows the theme's gradient rather
 * than an empty box, and there is no loading state to manage.
 *
 * **In `page` it reaches the top edge.** Inside a `Screen` it pulls itself up
 * under the scrollable's top spacer and grows by the same amount, so it runs
 * under the status bar and an overlay navbar with no gap; outside one it grows
 * by the safe-area inset. Both read the UI thread, so the cover moves in the
 * same frame the navbar measures. `children` sit in an overlay that starts below
 * that inset, so a button pinned `top-2` is never under the clock.
 *
 * Mounting it is what tells `PageHeader.Avatar` to lift over its lower edge.
 */
export function PageHeaderCover({
	source,
	colors,
	height = PAGE_HEADER_COVER_HEIGHT,
	isInsetAware = true,
	accessibilityLabel,
	imageProps,
	onError,
	className,
	style,
	children,
	...props
}: PageHeaderCoverProps): ReactElement {
	const { variant } = usePageHeaderPart("PageHeader.Cover");
	const registerCover = usePageHeaderCoverRegistry();
	const screen = useScreenContext();
	const navbar = screen?.navbar ?? null;
	const isInScreen = screen !== null;
	const { top } = useSafeAreaInsets();
	const slots = pageHeaderVariants({ variant });

	useLayoutEffect(() => {
		registerCover?.(true);
		return () => registerCover?.(false);
	}, [registerCover]);

	// A fixed number of lookups — hook order cannot depend on how many colours
	// were passed. An absent stop repeats the first and is dropped below.
	const stops = colors ?? DEFAULT_COVER_COLORS;
	const resolved = [
		useThemeColor(stops[0]),
		useThemeColor(stops[1]),
		useThemeColor(stops[2] ?? stops[0]),
		useThemeColor(stops[3] ?? stops[0]),
	].slice(0, stops.length);
	const gradient = resolvePageHeaderCoverStops({ resolved, isDefault: colors === undefined });

	const coverStyle = useAnimatedStyle(() => {
		const inset = navbar
			? resolveScrollTopInset({
					navbarHeight: navbar.height.value,
					navbarPlacement: navbar.placement.value,
					safeAreaTop: top,
				})
			: top;
		return {
			height: resolvePageHeaderCoverHeight({ variant, height, topInset: inset, isInsetAware }),
			marginTop: resolvePageHeaderCoverOffset({ variant, isInsetAware, isInScreen, topInset: inset }),
		};
	}, [navbar, top, variant, height, isInsetAware, isInScreen]);

	const overlayStyle = useAnimatedStyle(() => {
		const inset = navbar
			? resolveScrollTopInset({
					navbarHeight: navbar.height.value,
					navbarPlacement: navbar.placement.value,
					safeAreaTop: top,
				})
			: top;
		return {
			top: resolvePageHeaderCoverHeight({ variant, height, topInset: inset, isInsetAware }) - Math.max(0, height),
		};
	}, [navbar, top, variant, height, isInsetAware]);

	const isDescribed = accessibilityLabel !== undefined;

	// The picture layer is the one hidden from assistive technology, never the
	// cover itself, so an overlaid back button stays reachable on a decorative
	// cover.
	return (
		<Animated.View className={cn(slots.cover(), className)} style={[coverStyle, style]} {...props}>
			<View
				accessibilityElementsHidden={!isDescribed}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole={isDescribed ? "image" : undefined}
				accessible={isDescribed}
				className={slots.coverFallback()}
				importantForAccessibility={isDescribed ? "yes" : "no-hide-descendants"}
				pointerEvents="none"
			>
				{gradient ? <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} /> : null}
				{source !== undefined ? (
					<Image
						accessibilityIgnoresInvertColors
						resizeMode="cover"
						{...imageProps}
						className={cn(slots.coverFallback(), imageProps?.className)}
						onError={onError}
						source={source}
					/>
				) : null}
			</View>
			{children ? (
				<Animated.View className={slots.coverOverlay()} pointerEvents="box-none" style={overlayStyle}>
					{children}
				</Animated.View>
			) : null}
		</Animated.View>
	);
}
PageHeaderCover.displayName = "DelacourUI.PageHeader.Cover";
