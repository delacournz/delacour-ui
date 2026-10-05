import { Children, type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { Separator } from "../separator";
import { type MarkerContextValue, MarkerProvider, type MarkerShimmerRegistry } from "./marker.context";
import { MARKER_ICON_TOKEN, type MarkerVariant, markerVariants, resolveMarkerInteractive } from "./marker.variants";
import { MarkerContent } from "./marker-content";
import { MarkerIcon } from "./marker-icon";

/** The subset of `Pressable`'s props that means something on a marker. */
export type MarkerPressableProps = Pick<
	PressableProps,
	"feedback" | "haptic" | "hitSlop" | "pressedOpacity" | "pressedScale" | "accessibilityHint"
>;

/**
 * Static unless given something to do — the Badge rule. With neither handler
 * the press props are refused at the type level, since there is nothing for
 * them to press.
 */
type MarkerInteraction =
	| ({ onPress?: undefined; onLongPress?: undefined } & { [K in keyof MarkerPressableProps]?: undefined })
	| ({ onPress: () => void; onLongPress?: () => void } & MarkerPressableProps)
	| ({ onPress?: () => void; onLongPress: () => void } & MarkerPressableProps);

export type MarkerProps = MarkerInteraction & {
	/** How the marker sits between the entries around it. Default `default`. */
	variant?: MarkerVariant;
	/** Dims the marker; on an interactive one, also blocks the press and is announced. */
	isDisabled?: boolean;
	className?: string;
	children: ReactNode;
	testID?: string;
	accessibilityLabel?: string;
};

function MarkerRoot({
	variant = "default",
	isDisabled = false,
	className,
	children,
	testID,
	accessibilityLabel,
	onPress,
	onLongPress,
	feedback = "fade",
	haptic,
	hitSlop,
	pressedOpacity,
	pressedScale,
	accessibilityHint,
}: MarkerProps): ReactElement {
	const [shimmerCount, setShimmerCount] = useState(0);
	const isBusy = shimmerCount > 0;

	const registerShimmer = useCallback<MarkerShimmerRegistry>(() => {
		setShimmerCount((count) => count + 1);
		return () => setShimmerCount((count) => count - 1);
	}, []);

	const context = useMemo<MarkerContextValue>(() => ({ variant, isDisabled, isBusy }), [variant, isDisabled, isBusy]);

	const slots = markerVariants({ variant, isDisabled });
	const iconClassName = slots.icon();
	const iconDefaults = useMemo(() => ({ className: iconClassName, color: MARKER_ICON_TOKEN }), [iconClassName]);

	const content = useMemo(() => wrapTextChildren(children), [children]);
	const rootClassName = slots.root({ className });

	// `separator` rules its label off each side; the Separators hide themselves from assistive technology.
	const inner = (
		<IconDefaultsProvider value={iconDefaults}>
			{variant === "separator" ? <Separator className={slots.rule()} /> : null}
			{content}
			{variant === "separator" ? <Separator className={slots.rule()} /> : null}
		</IconDefaultsProvider>
	);

	// A marker with nothing to do is a line of text, not a control — see `resolveMarkerInteractive`.
	if (!resolveMarkerInteractive({ onPress, onLongPress })) {
		return (
			<MarkerProvider registerShimmer={registerShimmer} value={context}>
				<View
					accessibilityLabel={accessibilityLabel}
					accessibilityRole="text"
					accessibilityState={{ busy: isBusy }}
					accessible
					className={rootClassName}
					testID={testID}
				>
					{inner}
				</View>
			</MarkerProvider>
		);
	}

	return (
		<MarkerProvider registerShimmer={registerShimmer} value={context}>
			<Pressable
				accessibilityHint={accessibilityHint}
				accessibilityLabel={accessibilityLabel}
				className={rootClassName}
				disabled={isDisabled}
				feedback={feedback}
				haptic={haptic}
				hitSlop={hitSlop}
				onLongPress={onLongPress}
				onPress={onPress}
				pressedOpacity={pressedOpacity}
				pressedScale={pressedScale}
				testID={testID}
			>
				{inner}
			</Pressable>
		</MarkerProvider>
	);
}

/**
 * Wraps bare text children in a `Marker.Content`, consecutive strings and numbers
 * collapsing into one — `{count} files` is one piece of text. React Native
 * cannot render a string outside a `<Text>`, so `<Marker>Yesterday</Marker>`
 * would otherwise crash.
 */
function wrapTextChildren(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(<MarkerContent key={`content-${output.length}`}>{run.join("")}</MarkerContent>);
		run = [];
	};

	for (const child of items) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		output.push(child);
	}
	flushRun();

	return output;
}

/**
 * An inline note between the turns of a conversation or the entries of a feed:
 * something that **happened**, not something someone **said**. Centred, muted,
 * no speaker, no bubble.
 *
 * Three variants: `default`, a bare row of glyph and text; `border`, the same
 * row in a hairline capsule, for closing a section; `separator`, a label with a
 * rule each side, for day breaks.
 *
 * **A marker is a note until it is given something to do.** With no `onPress`
 * or `onLongPress` it is a plain `View`, read as text. Supply either and it
 * becomes a `Pressable` announced as a button, pressing with `fade`.
 *
 * `Marker.Content shimmer` says the step is still running: the text breathes,
 * and the marker is announced busy. Drop it the moment the step finishes.
 *
 * String children are wrapped in `Marker.Content` automatically. A bare `<Icon>`
 * inside `Marker.Icon` comes out at the marker's size and muted colour.
 *
 * @example
 * <Marker>
 *   <Marker.Icon><Icon icon={IconMagnifyingGlass} /></Marker.Icon>
 *   <Marker.Content>Explored 4 files</Marker.Content>
 * </Marker>
 *
 * @example
 * <Marker accessibilityHint="Shows the files" onPress={() => expand(step)}>
 *   <Marker.Icon><Icon icon={IconMagnifyingGlass} /></Marker.Icon>
 *   <Marker.Content shimmer={step.isRunning}>Searching files</Marker.Content>
 * </Marker>
 *
 * @example
 * <Marker variant="separator">Yesterday</Marker>
 */
export const Marker = Object.assign(MarkerRoot, {
	/** The leading glyph slot. Hidden from assistive technology — it restates the text. */
	Icon: MarkerIcon,
	/** The marker's text. `shimmer` while the step it names is running. */
	Content: MarkerContent,
	displayName: "DelacourUI.Marker",
});
