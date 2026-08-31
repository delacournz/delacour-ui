import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import {
	AXIS_SELECTED_ROW_CLASS,
	AXIS_TWO_LINE_ROW_HEIGHT,
	AxisSheet,
	type AxisSheetControlProps,
	useAxisChoice,
} from "@/components/theme/axis-sheet";
import { RadiusPreview } from "@/components/theme/previews";
import { RADII } from "@/design-system/radii";
import { useDesignSystem } from "@/design-system/store";
import { styleByName } from "@/design-system/styles";

/**
 * The corner, last in the composition so it can square a style without
 * replacing the rest of its numbers.
 *
 * `default` carries a null value rather than a number, which is what lets it
 * mean "whatever the style chose" instead of pinning a fifth radius that would
 * quietly override all eight styles. Its preview therefore has to reach for the
 * current style's own corner to draw anything truthful.
 */
export function RadiusBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	// Only `default` carries a description, so the list is one tall row and four
	// short ones — averaged rather than summed, because the shell takes a single
	// row height and rounding it up is the cheap side to be wrong on.
	const rowHeight = Math.ceil((AXIS_TWO_LINE_ROW_HEIGHT + (RADII.length - 1) * 56) / RADII.length);
	const config = useDesignSystem();
	const choose = useAxisChoice("radius", onOpenChange);
	const styleRadius = styleByName(config.style)?.geometry.radius ?? 0;

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={RADII.length} rowHeight={rowHeight} title="Radius">
			<ListGroup isDivided={false} variant="transparent">
				{RADII.map((candidate) => (
					<ListGroup.Item
						className={config.radius === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						key={candidate.name}
						onPress={() => choose(candidate.name)}
						testID={`theme-option-radius-${candidate.name}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
							{candidate.value === null ? (
								<ListGroup.ItemDescription>Whatever the style chose</ListGroup.ItemDescription>
							) : null}
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<RadiusPreview radius={candidate.value ?? styleRadius} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		</AxisSheet>
	);
}
RadiusBottomSheet.displayName = "Playground.RadiusBottomSheet";
