import { Children, type ReactElement, type ReactNode, useMemo } from "react";
import { type AccessibilityActionEvent, View } from "react-native";
import { useLabels } from "../../hooks/use-labels";
import { warnInteractiveChildInAccessible } from "../../lib/interactive-child";
import type { BadgeLabels } from "../../lib/labels";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { TextClassProvider } from "../text/text.context";
import { type BadgeContextValue, BadgeProvider } from "./badge.context";
import {
	BADGE_FOREGROUND_TOKEN,
	type BadgeColor,
	type BadgeMaterial,
	type BadgeSize,
	type BadgeVariant,
	badgeVariants,
	resolveBadgeCloseExposure,
	resolveBadgeInteractive,
} from "./badge.variants";
import { BadgeCloseButton } from "./badge-close-button";
import { BadgeEndContent } from "./badge-end-content";
import { BadgeLabel } from "./badge-label";
import { BadgeStartContent } from "./badge-start-content";

export type BadgeProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled"> & {
	/** How the surface is painted. */
	variant?: BadgeVariant;
	/** What the surface means. */
	color?: BadgeColor;
	size?: BadgeSize;
	/** `flat` by default, a capsule. `etched` squares the corner and tints soft status fills as an alpha. */
	material?: BadgeMaterial;
	isDisabled?: boolean;
	/** Composes a trailing dismiss control in. Its press never reaches `onPress`. */
	onClose?: () => void;
	/** Name a screen reader gives the dismiss control. Defaults to `labels.remove`. */
	closeAccessibilityLabel?: string;
	/** `testID` for the dismiss control, so a test or automation can press it. */
	closeTestID?: string;
	/**
	 * The spoken strings, laid over `DelacourProvider`'s `labels`, which sit over English.
	 * `closeAccessibilityLabel` still wins over `remove`.
	 */
	labels?: Partial<BadgeLabels>;
	children?: ReactNode;
};

function BadgeRoot({
	variant = "solid",
	color = "default",
	material = "flat",
	size = "md",
	isDisabled = false,
	onClose,
	closeAccessibilityLabel,
	closeTestID,
	labels: labelsProp,
	accessibilityActions,
	onAccessibilityAction,
	onPress,
	onLongPress,
	haptic,
	feedback = "scale",
	pressedScale,
	pressedOpacity,
	className,
	children,
	...props
}: BadgeProps): ReactElement {
	const labels = useLabels("badge", labelsProp);
	const context = useMemo<BadgeContextValue>(
		() => ({ variant, color, size, isDisabled, material, labels }),
		[variant, color, size, isDisabled, material, labels]
	);

	const slots = badgeVariants({ color, isDisabled, material, size, variant });

	// Icons composed into the badge adopt these unless told otherwise.
	const iconClassName = slots.icon();
	const foregroundToken = BADGE_FOREGROUND_TOKEN[variant][color];
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: foregroundToken }),
		[iconClassName, foregroundToken]
	);

	const content = useMemo(() => wrapTextChildren(children), [children]);
	const rootClassName = slots.root({ className });

	const interactive = resolveBadgeInteractive({ onPress, onLongPress });
	const closeExposure = resolveBadgeCloseExposure({
		accessible: props.accessible,
		hasClose: onClose !== undefined,
		interactive,
	});
	warnInteractiveChildInAccessible({
		accessible: interactive || props.accessible === true,
		children,
		component: "Badge",
	});
	const closeHidden = closeExposure === "action";
	const inner = (
		<IconDefaultsProvider value={iconDefaults}>
			<TextClassProvider value={slots.label()}>
				{content}
				{onClose ? (
					<BadgeCloseButton
						accessibilityElementsHidden={closeHidden}
						accessibilityLabel={closeAccessibilityLabel}
						accessible={!closeHidden}
						importantForAccessibility={closeHidden ? "no-hide-descendants" : "auto"}
						onPress={onClose}
						testID={closeTestID}
					/>
				) : null}
			</TextClassProvider>
		</IconDefaultsProvider>
	);

	const actions = closeHidden
		? [...(accessibilityActions ?? []), { label: closeAccessibilityLabel ?? labels.remove, name: "remove" }]
		: accessibilityActions;

	const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
		if (closeHidden && event.nativeEvent.actionName === "remove" && !isDisabled) {
			onClose?.();
			return;
		}
		onAccessibilityAction?.(event);
	};

	// A badge with nothing to do stays a plain box — see `resolveBadgeInteractive`.
	if (!interactive) {
		return (
			<BadgeProvider value={context}>
				<View
					accessibilityActions={actions}
					className={rootClassName}
					onAccessibilityAction={handleAccessibilityAction}
					{...props}
				>
					{inner}
				</View>
			</BadgeProvider>
		);
	}

	return (
		<BadgeProvider value={context}>
			<Pressable
				accessibilityActions={actions}
				accessibilityRole="button"
				className={rootClassName}
				disabled={isDisabled}
				feedback={feedback}
				haptic={haptic}
				onAccessibilityAction={handleAccessibilityAction}
				onLongPress={onLongPress}
				onPress={onPress}
				pressedOpacity={pressedOpacity}
				pressedScale={pressedScale}
				{...props}
			>
				{inner}
			</Pressable>
		</BadgeProvider>
	);
}

/**
 * Wraps bare text children in a `Badge.Label`.
 *
 * React Native cannot render a string outside a `<Text>`, so `<Badge>New</Badge>`
 * would otherwise crash. Consecutive strings and numbers are collected into a
 * single label rather than one each — `{count} left` is one piece of text, and
 * wrapping the parts separately would space them apart by the badge's gap.
 */
function wrapTextChildren(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(<BadgeLabel key={`label-${output.length}`}>{run.join("")}</BadgeLabel>);
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
 * A compact label for status, category or count — composed from parts rather
 * than configured by flags.
 *
 * Two axes describe the surface: `variant` says how it is painted (`solid`,
 * `soft`, `outline`, `ghost`) and `color` says what it means (`default`,
 * `primary`, `success`, `warning`, `destructive`, `info`). They are orthogonal, so
 * every one of the twenty-four pairings is reachable without the library naming
 * each combination.
 *
 * **A badge is content until it is given something to do.** With no `onPress` or
 * `onLongPress` it renders a plain `View` — no gesture detector, and nothing
 * announced to assistive technology as a control. Supply either and the root
 * becomes a `Pressable`, inheriting `feedback`, `haptic` and the rest; only the
 * default differs, `scale`.
 *
 * `onClose` composes a dismiss control in at the end. It is a pressable of its
 * own, so dismissing never also fires `onPress`. On a pressable badge, or a plain one
 * the caller made `accessible`, the root is one accessibility element that folds the
 * control in, so the control is hidden there and offered as a `remove` accessibility
 * action instead.
 *
 * Plain string or number children are wrapped in a `Badge.Label` automatically;
 * pass the compound parts when a layout needs more control.
 *
 * Icons are composed in, not passed as props. Anything in the subtree inherits
 * the badge's icon size and its surface's colour, so an `Icon` needs nothing but
 * the glyph. Text works the same way — a bare `<Text>` comes out at the label's
 * colour and type scale without being told.
 *
 * @example
 * <Badge color="success" variant="soft">Active</Badge>
 *
 * @example
 * <Badge color="warning" variant="outline">
 *   <Icon icon={IconStar} />
 *   <Badge.Label>Premium</Badge.Label>
 * </Badge>
 *
 * @example
 * <Badge onClose={() => remove(tag)} onPress={() => filter(tag)}>
 *   {tag}
 * </Badge>
 */
export const Badge = Object.assign(BadgeRoot, {
	/** The badge's text. Picks its colour and type scale from the badge's variant, colour and size. */
	Label: BadgeLabel,
	/** A centred wrapper for leading content that is not an `Icon` — a status dot, an avatar. */
	StartContent: BadgeStartContent,
	/** A centred wrapper for trailing content that is not an `Icon`. */
	EndContent: BadgeEndContent,
	/** The trailing dismiss control. Composed in automatically whenever `onClose` is set. */
	CloseButton: BadgeCloseButton,
	displayName: "DelacourUI.Badge",
});
