import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import {
	AXIS_SELECTED_ROW_CLASS,
	AxisSheet,
	type AxisSheetControlProps,
	useAxisChoice,
} from "@/components/theme/axis-sheet";
import { ColorPreview, SWATCH_TOKENS } from "@/components/theme/previews";
import { useAxisPreview } from "@/components/theme/use-axis-preview";
import { BASE_COLORS } from "@/design-system/base-colors";

/**
 * The neutral ramp everything else is spread over.
 *
 * Four swatches per row rather than one, because two neutrals differ by less
 * than a single disc can show — it is `background` against `destructive` that
 * tells stone from zinc at a glance.
 */
export function BaseColorBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const { config, preview } = useAxisPreview();
	const choose = useAxisChoice("baseColor", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={BASE_COLORS.length} title="Base Color">
			<ListGroup isDivided={false} variant="transparent">
				{BASE_COLORS.map((candidate) => (
					<ListGroup.Item
						className={config.baseColor === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						key={candidate.name}
						onPress={() => choose(candidate.name)}
						testID={`theme-option-baseColor-${candidate.name}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ColorPreview tokens={SWATCH_TOKENS} values={preview({ baseColor: candidate.name })} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		</AxisSheet>
	);
}
BaseColorBottomSheet.displayName = "Playground.BaseColorBottomSheet";
