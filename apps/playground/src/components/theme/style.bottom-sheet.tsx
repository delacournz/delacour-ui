import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import {
	AXIS_SELECTED_ROW_CLASS,
	AxisSheet,
	type AxisSheetControlProps,
	useAxisChoice,
} from "@/components/theme/axis-sheet";
import { RadiusPreview } from "@/components/theme/previews";
import { useDesignSystem } from "@/design-system/store";
import { STYLES } from "@/design-system/styles";

/**
 * The geometry axis: eight named scales of radius, control height and type.
 *
 * Two-line rows — each style carries a description, and without it eight
 * invented names say nothing about what choosing one would do. That is why this
 * is the one sheet that raises `rowHeight`.
 */
export function StyleBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const choose = useAxisChoice("style", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={STYLES.length} rowHeight={76} title="Style">
			<ListGroup isDivided={false} variant="transparent">
				{STYLES.map((candidate) => (
					<ListGroup.Item
						className={config.style === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						key={candidate.name}
						onPress={() => choose(candidate.name)}
						testID={`theme-option-style-${candidate.name}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>{candidate.description}</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<RadiusPreview radius={candidate.geometry.radius} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		</AxisSheet>
	);
}
StyleBottomSheet.displayName = "Playground.StyleBottomSheet";
