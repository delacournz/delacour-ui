import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { IconCheckmark1Small } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import { resolveTimelineIndicator, timelineVariants } from "./timeline.variants";

export type TimelineIndicatorProps = Omit<ViewProps, "children"> & {
	className?: string;
	/** An `Icon` for the `icon` variant. It inherits the glyph's size and the indicator's colour. */
	children?: ReactNode;
};

/**
 * An event's marker: a dot, a circle holding its one-based number, or a circle
 * holding the caller's icon (a check once completed, when none is given).
 *
 * Composed in automatically; write it out to give an `icon` event its glyph, or to
 * restyle the marker. Wherever it is written among an item's children, the item
 * lifts it into the track.
 *
 * Painted by {@link resolveTimelineIndicator}: a default event fills primary once
 * reached and is a muted ring ahead of the value; a toned event is its soft pair
 * whatever its progress. Hidden from assistive technology — the item's value
 * already reads the position, status and tone.
 */
export function TimelineIndicator({ className, children, ...props }: TimelineIndicatorProps): ReactElement {
	const { step, status, tone, size, variant } = useTimelineItemPart("Timeline.Indicator");
	const hasIcon = children !== undefined && children !== null && children !== false;
	const { foreground, glyph } = resolveTimelineIndicator({ hasIcon, status, tone, variant });

	const slots = timelineVariants({ size, status, tone, variant });
	const glyphClass = slots.glyph();
	const iconDefaults = useMemo(() => ({ className: glyphClass ?? "", color: foreground }), [glyphClass, foreground]);

	const renderGlyph = (): ReactNode => {
		switch (glyph) {
			case "dot":
				return null;
			case "icon":
				return children;
			case "check":
				return <Icon icon={IconCheckmark1Small} />;
			case "number":
				return (
					<Text allowFontScaling={false} className={slots.indicatorLabel()}>
						{step + 1}
					</Text>
				);
		}
	};

	return (
		<View
			accessibilityElementsHidden
			className={slots.indicator({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		>
			<IconDefaultsProvider value={iconDefaults}>{renderGlyph()}</IconDefaultsProvider>
		</View>
	);
}
TimelineIndicator.displayName = "DelacourUI.Timeline.Indicator";
