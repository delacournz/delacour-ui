import type { ReactElement } from "react";
import { Pressable } from "../pressable";
import { useSectionRailPart } from "./section-rail.context";
import { sectionRailVariants } from "./section-rail.variants";

/**
 * The transparent layer behind an open panel that closes it on an outside tap.
 *
 * Transparent on purpose — it catches the tap, it does not dim the page the
 * reader is choosing a place in. Hidden from assistive technology: the panel
 * itself is modal to VoiceOver and closes on the escape gesture.
 */
export function SectionRailScrim(): ReactElement {
	const { setOpen } = useSectionRailPart("SectionRail.Scrim");

	return (
		<Pressable
			accessibilityElementsHidden
			className={sectionRailVariants().scrim()}
			feedback="none"
			importantForAccessibility="no-hide-descendants"
			onPress={() => setOpen(false)}
		/>
	);
}
SectionRailScrim.displayName = "DelacourUI.SectionRail.Scrim";
