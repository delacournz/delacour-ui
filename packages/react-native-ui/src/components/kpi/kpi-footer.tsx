import { Children, type ReactElement, type ReactNode } from "react";
import type { CardFooterProps } from "../card";
import { Card } from "../card";
import { Text } from "../text";
import { useKpiPart } from "./kpi.context";
import { kpiVariants } from "./kpi.variants";

export type KpiFooterProps = CardFooterProps;

/**
 * Wraps each run of bare strings and numbers in one muted caption. A raw string
 * inside a `View` is a red box in React Native, and the run is joined rather
 * than wrapped piece by piece: `last {days} days` is three children, and three
 * `Text`s in the footer's row would sit apart by its gap.
 */
function wrapBareText(children: ReactNode, className: string): ReactNode[] {
	const output: ReactNode[] = [];
	let run: string[] = [];
	const flush = (): void => {
		if (run.length === 0) return;
		output.push(
			<Text className={className} key={`text-${output.length}`}>
				{run.join("")}
			</Text>
		);
		run = [];
	};

	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(String(child));
		} else {
			flush();
			output.push(child);
		}
	}
	flush();
	return output;
}

/**
 * The bottom strip — a comparison period, a caveat, a link.
 *
 * `Card.Footer`, so `variant="band"` sets it into the card on the next fill
 * down, and it must be the last child for the same reason. Bare text becomes a
 * muted caption at the card's scale.
 */
export function KpiFooter({ children, ...props }: KpiFooterProps): ReactElement {
	const { size } = useKpiPart("Kpi.Footer");
	return <Card.Footer {...props}>{wrapBareText(children, kpiVariants({ size }).trendCaption())}</Card.Footer>;
}
KpiFooter.displayName = "DelacourUI.Kpi.Footer";
