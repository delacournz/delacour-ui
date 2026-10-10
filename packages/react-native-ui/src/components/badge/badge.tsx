import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { wrapTextChildren } from "../../lib/wrap-text-children";
import { IconDefaultsProvider } from "../icon";
import { TextClassProvider } from "../text/text.context";
import { type BadgeContextValue, BadgeProvider } from "./badge.context";
import {
	BADGE_FOREGROUND_TOKEN,
	type BadgeColor,
	type BadgePlacement,
	type BadgeSize,
	type BadgeVariant,
	badgeVariants,
	resolveBadgeCount,
	resolveBadgeShape,
} from "./badge.variants";
import { BadgeAnchor } from "./badge-anchor";
import { BadgeEndContent } from "./badge-end-content";
import { BadgeLabel } from "./badge-label";
import { BadgeStartContent } from "./badge-start-content";

type BadgeBaseProps = ViewProps & {
	/** How the surface is painted. A dot is solid whichever is set. */
	variant?: BadgeVariant;
	/** What the surface means. */
	color?: BadgeColor;
	size?: BadgeSize;
	/**
	 * Pins the badge to a corner of its parent, hanging over the edge. The parent
	 * has to be sized by its content — wrap the pair in a `Badge.Anchor`.
	 */
	placement?: BadgePlacement;
	className?: string;
};

/** A label, or — with no children at all — a dot. */
type BadgeContentProps = {
	count?: undefined;
	max?: never;
	showZero?: never;
	children?: ReactNode;
};

/** A count. It is the whole content, so it takes no children. */
type BadgeCountProps = {
	/** The number to show. Draws nothing at zero unless `showZero` is set. */
	count: number;
	/** The largest number printed; past it the badge reads `99+`. Default `99`. */
	max?: number;
	/** Draw the badge at zero rather than hiding it. */
	showZero?: boolean;
	children?: never;
};

export type BadgeProps = BadgeBaseProps & (BadgeContentProps | BadgeCountProps);

function BadgeRoot({
	variant = "solid",
	color = "default",
	size = "md",
	placement,
	count,
	max,
	showZero,
	className,
	children,
	...props
}: BadgeProps): ReactElement | null {
	const context = useMemo<BadgeContextValue>(() => ({ variant, color, size }), [variant, color, size]);

	const content = useMemo(
		() => wrapTextChildren(children, (text, key) => <BadgeLabel key={key}>{text}</BadgeLabel>),
		[children]
	);
	const shape = resolveBadgeShape({ count, hasChildren: content.length > 0 });
	const slots = badgeVariants({ color, placement, shape, size, variant });

	// Icons composed into the badge adopt these unless told otherwise.
	const iconClassName = slots.icon();
	const foregroundToken = BADGE_FOREGROUND_TOKEN[variant][color];
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: foregroundToken }),
		[iconClassName, foregroundToken]
	);

	// A count that resolves to nothing — zero, without `showZero` — draws nothing,
	// so a caller never has to wrap the badge in a condition of their own.
	const countText = count === undefined ? null : resolveBadgeCount({ count, max, showZero });
	if (shape === "count" && countText === null) return null;

	return (
		<BadgeProvider value={context}>
			<View className={slots.root({ className })} {...props}>
				<IconDefaultsProvider value={iconDefaults}>
					<TextClassProvider value={slots.label()}>
						{shape === "count" ? <BadgeLabel>{countText}</BadgeLabel> : content}
					</TextClassProvider>
				</IconDefaultsProvider>
			</View>
		</BadgeProvider>
	);
}

/**
 * A compact, read-only mark — a status, a category, a count, or a dot that says
 * only that there is something. Composed from parts rather than configured by
 * flags.
 *
 * **A badge is never pressed.** It is a plain `View` with no gesture detector
 * and nothing announced as a control. Something to tap, toggle or remove is a
 * [`Chip`](../chip/AGENTS.md), which shares this component's colours and tones.
 *
 * Two axes describe the surface: `variant` says how it is painted (`solid`,
 * `soft`, `outline`, `ghost`) and `color` says what it means (`default`,
 * `primary`, `success`, `warning`, `destructive`, `info`). They are orthogonal, so
 * every one of the twenty-four pairings is reachable without the library naming
 * each combination.
 *
 * **What it draws is read from what it is given:**
 *
 * - **Children** — a label. Plain strings and numbers are wrapped in a
 *   `Badge.Label` automatically; pass the parts when a layout needs more control.
 * - **`count`** — a number, in a circle while it is one digit. Past `max` it
 *   reads `99+`, and at zero it draws nothing unless `showZero` is set.
 * - **Neither** — a dot, solid in its `color`.
 *
 * `placement` pins any of the three to a corner of its parent, pinned by its
 * inner edge so a count that gains a digit grows outward. Wrap the pair in a
 * `Badge.Anchor`, which sizes the parent to what it holds. An `Avatar` pins its
 * own through `Avatar.Badge`, so a badge inside one takes no `placement`.
 *
 * Icons are composed in, not passed as props. Anything in the subtree inherits
 * the badge's icon size and its surface's colour, so an `Icon` needs nothing but
 * the glyph. Text works the same way — a bare `<Text>` comes out at the label's
 * colour and type scale without being told.
 *
 * A dot and a count say nothing useful to a screen reader on their own — "3" is
 * not "3 unread". Put the meaning into the `accessibilityLabel` of the thing the
 * badge sits on.
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
 * <Badge.Anchor>
 *   <Icon icon={IconBell} size="lg" />
 *   <Badge color="destructive" count={unread} placement="top-right" size="sm" />
 * </Badge.Anchor>
 */
export const Badge = Object.assign(BadgeRoot, {
	/** The badge's text. Picks its colour and type scale from the badge's variant, colour and size. */
	Label: BadgeLabel,
	/** A centred wrapper for leading content that is not an `Icon` — a status dot, an avatar. */
	StartContent: BadgeStartContent,
	/** A centred wrapper for trailing content that is not an `Icon`. */
	EndContent: BadgeEndContent,
	/** The content-sized box a badge with a `placement` is pinned to a corner of. */
	Anchor: BadgeAnchor,
	displayName: "DelacourUI.Badge",
});
