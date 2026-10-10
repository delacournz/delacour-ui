import type { ReactElement } from "react";
import { View } from "react-native";
import type { BadgeSlotProps } from "./badge.types";
import { badgeVariants } from "./badge.variants";

/**
 * The box a placed badge is pinned to a corner of — an icon, a button, anything
 * that is not an `Avatar`, which pins its own.
 *
 * It adds the two things that go wrong without it. The box is sized by what it
 * holds: a plain `View` in a gap column is stretched to the column's width, and
 * a badge pinned to its top-right corner then sits at the far edge of the
 * screen rather than on the glyph. And it is a row: Yoga caps an absolute child
 * at the width of a column parent, which wraps a `99+` over a small glyph.
 *
 * The badge is pinned by its own `placement`, not by anything read from here, so
 * a `Badge` deeper in the subtree — in a card that happens to carry a count — is
 * left where it was put.
 */
export function BadgeAnchor({ className, ...props }: BadgeSlotProps): ReactElement {
	return <View className={badgeVariants().anchor({ className })} {...props} />;
}
BadgeAnchor.displayName = "DelacourUI.Badge.Anchor";
