import type { ReactElement } from "react";
import { Text } from "../text";
import { useKpiPart } from "./kpi.context";
import type { KpiTextProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/**
 * The metric's name. Quiet on purpose — `muted-foreground`, a step down the
 * type scale — because the value is the thing being read.
 *
 * It never grows to fill its row: in a column that would absorb the spare
 * height and land a row of cards' numbers at different heights. The header
 * pushes its action to the end instead.
 */
export function KpiTitle({ className, ...props }: KpiTextProps): ReactElement {
	const { size } = useKpiPart("Kpi.Title");
	return <Text className={kpiVariants({ size }).title({ className })} numberOfLines={1} {...props} />;
}
KpiTitle.displayName = "DelacourUI.Kpi.Title";
