import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { IconDefaultsProvider } from "../icon";
import { useKpiPart } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/**
 * A tinted square for a glyph.
 *
 * It takes the element rather than drawing one — a metric's icon is the app's
 * choice — and hands an unstyled `Icon` inside it the card's series colour and
 * a step of the icon scale sized to the square. The square is that colour at
 * 15%, so a row of cards given five colour indexes reads as five series.
 */
export function KpiIcon({ className, children, ...props }: KpiSlotProps): ReactElement {
	const { size, colorIndex } = useKpiPart("Kpi.Icon");
	const slots = kpiVariants({ colorIndex, size });
	const glyph = slots.iconGlyph();
	const defaults = useMemo(() => ({ className: glyph, color: `chart-${colorIndex}` }), [glyph, colorIndex]);

	return (
		<View className={slots.icon({ className })} {...props}>
			<IconDefaultsProvider value={defaults}>{children}</IconDefaultsProvider>
		</View>
	);
}
KpiIcon.displayName = "DelacourUI.Kpi.Icon";
