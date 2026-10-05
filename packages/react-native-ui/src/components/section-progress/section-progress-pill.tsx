import { type ReactElement, useCallback } from "react";
import { useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolveLabelMaxWidth,
	SECTION_PROGRESS_LABEL_FADE_MS,
	sectionProgressVariants,
} from "./section-progress.variants";
import { SectionProgressRing } from "./section-progress-ring";

export type SectionProgressPillProps = {
	/** Drawn as the open panel's edge row rather than as a free-standing capsule. */
	isInPanel: boolean;
};

/**
 * The pill: the ring and the active section's title, one button that opens and
 * closes the panel.
 *
 * Closed it wears its own capsule; open it is the panel's edge row, the same
 * content without the chrome, so the card reads as the pill grown out of
 * itself. The title cross-fades in, keyed by the section, and is capped at
 * sixty percent of the window on one line.
 *
 * VoiceOver reads it as "Sections, Pricing, 42 percent, button, collapsed".
 */
export function SectionProgressPill({ isInPanel }: SectionProgressPillProps): ReactElement {
	const { accessibilityLabel, accessibilityValue, isOpen, label, setOpen, value } =
		useSectionProgressPart("SectionProgress.Pill");
	const { width } = useWindowDimensions();
	const slots = sectionProgressVariants();

	const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ expanded: isOpen }}
			accessibilityValue={{ text: accessibilityValue }}
			className={isInPanel ? slots.pillRow() : slots.pill()}
			feedback={isInPanel ? "fade" : "scale"}
			onPress={toggle}
		>
			<SectionProgressRing />
			<Animated.View
				entering={FadeIn.duration(SECTION_PROGRESS_LABEL_FADE_MS)}
				key={value ?? ""}
				style={{ maxWidth: resolveLabelMaxWidth(width) }}
			>
				<Text.Label className={slots.label()} numberOfLines={1}>
					{label}
				</Text.Label>
			</Animated.View>
		</Pressable>
	);
}
SectionProgressPill.displayName = "DelacourUI.SectionProgress.Pill";
