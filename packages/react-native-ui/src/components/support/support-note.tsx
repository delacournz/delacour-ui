import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { IconClock, IconMoon } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { Text } from "../text";
import { useSupport } from "./support.context";
import type { SupportAvailability } from "./support.types";
import { SUPPORT_NOTE_ICON_TOKEN, supportVariants } from "./support.variants";

export type SupportNoteProps = Omit<ViewProps, "children"> & {
	/** `"We'll reply by email if you leave."` */
	children: string;
	/** The note's glyph. Absent ⇒ a moon while offline, a clock while away, none while online. */
	icon?: ReactElement;
	/** Override the root's availability for the default glyph. */
	availability?: SupportAvailability;
	className?: string;
};

const DEFAULT_GLYPH: Record<SupportAvailability, typeof IconMoon | null> = {
	online: null,
	away: IconClock,
	offline: IconMoon,
};

/**
 * A quiet line above the composer — what happens to a message sent now: `"We're away. We'll reply by
 * email."`. It sits above the composer rather than in the transcript because it describes the
 * next message, not a past one. Plain text to a screen reader.
 *
 * Works with no `<Support>` root: availability then defaults to `offline`.
 */
export function SupportNote({
	children,
	icon,
	availability: availabilityProp,
	className,
	...props
}: SupportNoteProps): ReactElement {
	const { availability: rootAvailability } = useSupport();
	const glyph = DEFAULT_GLYPH[availabilityProp ?? rootAvailability];
	const slots = supportVariants();
	const iconClassName = slots.noteIcon();
	const iconDefaults = useMemo(() => ({ className: iconClassName, color: SUPPORT_NOTE_ICON_TOKEN }), [iconClassName]);
	const leading = icon ?? (glyph ? <Icon icon={glyph} /> : null);

	return (
		<View accessibilityRole="text" accessible className={slots.note({ className })} {...props}>
			{leading ? <IconDefaultsProvider value={iconDefaults}>{leading}</IconDefaultsProvider> : null}
			<Text className={slots.noteLabel()}>{children}</Text>
		</View>
	);
}
SupportNote.displayName = "DelacourUI.Support.Note";
