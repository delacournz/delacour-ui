import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { IconCheckmark1Small } from "../../icons/central";
import { Avatar, type AvatarProps } from "../avatar";
import type { AvatarSize } from "../avatar/avatar.variants";
import { Icon } from "../icon";
import { usePageHeaderPart } from "./page-header.context";
import { resolvePageHeaderAvatarLabel } from "./page-header.utils";
import {
	PAGE_HEADER_RING_WIDTH,
	PAGE_HEADER_ROSETTE_FOREGROUND_TOKEN,
	pageHeaderVariants,
	resolvePageHeaderAvatarSize,
	resolvePageHeaderOverlap,
} from "./page-header.variants";

export type PageHeaderAvatarProps = Omit<AvatarProps, "size"> & {
	/** Default `2xl` (96pt) in a centred header, `xl` (64pt) on the leading edge. */
	size?: AvatarSize;
	/** Adds a verification rosette to the avatar's bottom-right corner, and says so to a screen reader. */
	isVerified?: boolean;
	/** Custom corner content in place of the rosette. Wins over `isVerified`'s drawing, not its label. */
	badge?: ReactNode;
	/** Whether the face lifts over the cover. Default: true when a `PageHeader.Cover` is mounted. */
	isOverlapping?: boolean;
	/** Classes for the ring around the face. `className` styles the avatar itself. */
	ringClassName?: string;
};

/**
 * The header's face — an `Avatar` in a ring of the header's own ground.
 *
 * **The ring is the fill below.** `bg-background` on a page, `bg-card` in a card,
 * so a face lifted over a picture is cut out of it cleanly rather than haloed.
 *
 * **It lifts itself.** With a cover mounted its top margin is minus half the
 * ringed face, so its middle sits on the cover's lower edge; the number comes
 * from `AVATAR_SIZE_POINTS`, which is why the size is an `Avatar` step and never
 * a class.
 *
 * **Verification is spoken.** The avatar is one element to assistive
 * technology, so `isVerified` appends ", verified" to its label as well as
 * drawing the rosette. A caller's `accessibilityLabel` wins outright.
 */
export function PageHeaderAvatar({
	size: sizeProp,
	isVerified = false,
	badge,
	isOverlapping,
	ringClassName,
	name,
	accessibilityLabel,
	children,
	...props
}: PageHeaderAvatarProps): ReactElement {
	const { variant, align, hasCover } = usePageHeaderPart("PageHeader.Avatar");
	const size = resolvePageHeaderAvatarSize(align, sizeProp);
	const slots = pageHeaderVariants({ variant, align });
	const overlap = resolvePageHeaderOverlap({
		avatarSize: size,
		ringWidth: PAGE_HEADER_RING_WIDTH,
		hasCover,
		isOverlapping,
	});
	const label = accessibilityLabel ?? resolvePageHeaderAvatarLabel(name, isVerified);
	const corner = badge ?? (isVerified ? <PageHeaderRosette /> : null);

	// The lift replaces the ring's own top margin rather than adding to it, so it
	// is written as a style only when there is one.
	return (
		<View
			className={slots.avatarRing({ className: ringClassName })}
			style={overlap ? { marginTop: overlap } : undefined}
		>
			<Avatar accessibilityLabel={label} name={name} size={size} {...props}>
				{corner ? <Avatar.Badge placement="bottom-right">{corner}</Avatar.Badge> : null}
				{children}
			</Avatar>
		</View>
	);
}
PageHeaderAvatar.displayName = "DelacourUI.PageHeader.Avatar";

/** The verification rosette — a check on `primary`, ringed in the header's ground. */
function PageHeaderRosette(): ReactElement {
	const { variant } = usePageHeaderPart("PageHeader.Avatar");
	return (
		<View className={pageHeaderVariants({ variant }).rosette()} pointerEvents="none">
			<Icon color={PAGE_HEADER_ROSETTE_FOREGROUND_TOKEN} icon={IconCheckmark1Small} size="sm" />
		</View>
	);
}
PageHeaderRosette.displayName = "DelacourUI.PageHeader.Avatar.Rosette";
