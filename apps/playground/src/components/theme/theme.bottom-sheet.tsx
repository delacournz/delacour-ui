import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import {
	AXIS_SELECTED_ROW_CLASS,
	AxisSheet,
	type AxisSheetControlProps,
	useAxisChoice,
} from "@/components/theme/axis-sheet";
import { ColorPreview } from "@/components/theme/previews";
import { usePaletteOptions } from "@/components/theme/use-palette-options";
import { useDesignSystem } from "@/design-system/store";

/** The accent, drawn as the one token it is judged on. */
const THEME_TOKENS = ["primary"] as const;

/**
 * The accent spread over the base ramp: the base colour itself, then seventeen.
 *
 * "No accent" is the first row rather than a missing one — it is the base
 * colour's own name, and choosing it is a real decision rather than the absence
 * of one.
 *
 * An accent deliberately carries no `secondary`. shadcn's hardcode it to a zinc
 * grey whatever the base colour, which is invisible on a web card and obvious
 * on `Button variant="secondary"`; letting the base colour's own secondary
 * stand is one of this customizer's two departures from the reference.
 */
export function ThemeBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const options = usePaletteOptions("theme");
	const choose = useAxisChoice("theme", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={options.length} title="Theme">
			<ListGroup isDivided={false} variant="transparent">
				{options.map((candidate) => (
					<ListGroup.Item
						className={config.theme === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						key={candidate.name}
						onPress={() => choose(candidate.name)}
						testID={`theme-option-theme-${candidate.name}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ColorPreview tokens={THEME_TOKENS} values={candidate.values} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		</AxisSheet>
	);
}
ThemeBottomSheet.displayName = "Playground.ThemeBottomSheet";
