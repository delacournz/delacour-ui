import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import {
	AXIS_SELECTED_ROW_CLASS,
	AxisSheet,
	type AxisSheetControlProps,
	useAxisChoice,
} from "@/components/theme/axis-sheet";
import { CHART_TOKENS, ColorPreview } from "@/components/theme/previews";
import { usePaletteOptions } from "@/components/theme/use-palette-options";
import { useDesignSystem } from "@/design-system/store";

/**
 * The same palette list as `Theme`, writing only `--chart-1` through `--chart-5`.
 *
 * A separate axis because a chart's five hues are read against each other
 * rather than against the page: the accent that makes the right button can make
 * five series nobody can tell apart.
 */
export function ChartColorBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const options = usePaletteOptions("chartColor");
	const choose = useAxisChoice("chartColor", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={options.length} title="Chart Color">
			<ListGroup isDivided={false} variant="transparent">
				{options.map((candidate) => (
					<ListGroup.Item
						className={config.chartColor === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						key={candidate.name}
						onPress={() => choose(candidate.name)}
						testID={`theme-option-chartColor-${candidate.name}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ColorPreview tokens={CHART_TOKENS} values={candidate.values} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		</AxisSheet>
	);
}
ChartColorBottomSheet.displayName = "Playground.ChartColorBottomSheet";
