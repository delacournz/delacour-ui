import { type ReactElement, type ReactNode, useCallback } from "react";
import { I18nManager, ScrollView, View } from "react-native";
import Animated, {
	type EntryAnimationsValues,
	FadeIn,
	FadeOut,
	type LayoutAnimation,
	useReducedMotion,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolvePanelMaxHeight,
	resolvePanelTransformOrigin,
	SECTION_PROGRESS_LABEL_FADE_MS,
	sectionProgressVariants,
} from "./section-progress.variants";
import { SectionProgressPill } from "./section-progress-pill";

/** Heavily damped: the card settles without overshooting the pill it grew from. */
const PANEL_SPRING = { damping: 28, mass: 0.6, stiffness: 320 } as const;
const PANEL_FADE_MS = 160;
const PANEL_INITIAL_SCALE = 0.9;
const LIST_MAX_HEIGHT = resolvePanelMaxHeight();

/** Scale-from-pill plus fade. A worklet Reanimated runs on the UI thread at mount. */
function panelEntering(_values: EntryAnimationsValues): LayoutAnimation {
	"worklet";
	return {
		initialValues: { opacity: 0, transform: [{ scale: PANEL_INITIAL_SCALE }] },
		animations: {
			opacity: withTiming(1, { duration: PANEL_FADE_MS }),
			transform: [{ scale: withSpring(1, PANEL_SPRING) }],
		},
	};
}

export type SectionProgressPanelProps = {
	/** The `SectionProgress.Item`s. */
	children: ReactNode;
};

/**
 * The open card: the pill's row at the edge nearest the screen's, a rule, and
 * the list of sections above (or below) it, scrolling past six rows.
 *
 * It grows out of the pill — scaled from the pill's own corner and faded in on
 * a damped spring — and fades out. With reduce motion on it only fades.
 *
 * VoiceOver is confined to it while open, and the escape gesture closes it.
 */
export function SectionProgressPanel({ children }: SectionProgressPanelProps): ReactElement {
	const { placement, setOpen } = useSectionProgressPart("SectionProgress.Panel");
	const isReducedMotion = useReducedMotion();
	const slots = sectionProgressVariants({ placement });

	const close = useCallback(() => setOpen(false), [setOpen]);

	return (
		<Animated.View
			accessibilityViewIsModal
			className={slots.panel()}
			entering={isReducedMotion ? FadeIn.duration(PANEL_FADE_MS) : panelEntering}
			exiting={FadeOut.duration(SECTION_PROGRESS_LABEL_FADE_MS)}
			onAccessibilityEscape={close}
			style={{ transformOrigin: resolvePanelTransformOrigin(placement, I18nManager.isRTL) }}
		>
			<SectionProgressPill isInPanel />
			<View className={slots.divider()} />
			<ScrollView bounces={false} contentContainerClassName={slots.list()} style={{ maxHeight: LIST_MAX_HEIGHT }}>
				{children}
			</ScrollView>
		</Animated.View>
	);
}
SectionProgressPanel.displayName = "DelacourUI.SectionProgress.Panel";
