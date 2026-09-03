import { FONT_GROUPS } from "@delacour/design-system/fonts";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AXIS_SELECTED_ROW_CLASS } from "@/components/theme/axis-sheet";
import { FontPreview } from "@/components/theme/previews";

export type FontOptionListProps = {
	/** The axis's current value — `"inherit"` counts as selected on the heading list. */
	selected: string;
	onSelect: (name: string) => void;
	/** Prepend the "Inherit — follows the body font" row. Heading only. */
	withInherit?: boolean;
};

/**
 * Twenty-six families, grouped, each drawn in itself.
 *
 * The layout `Font` and `Heading` share. It is a component rather than a hook
 * because nothing here is computed — `FontPreview` takes the family name
 * straight off the catalogue and resolves no tokens at all, which is why two
 * twenty-six-row lists cost nothing to keep mounted while the palette sheets
 * have to be memoised.
 *
 * `withInherit` is a boolean rather than a two-value mode: it adds one row and
 * changes nothing else, and an enum for that would be a prop pretending to be a
 * decision.
 *
 * The group labels are `Text.Overline` outside the `ListGroup`s rather than
 * rows within one, so a family is never one tap away from a heading that looks
 * like it could be chosen.
 */
export function FontOptionList({ selected, onSelect, withInherit }: FontOptionListProps): ReactElement {
	return (
		<View className="gap-3">
			{withInherit ? (
				<ListGroup isDivided={false} variant="transparent">
					<ListGroup.Item
						className={selected === "inherit" ? AXIS_SELECTED_ROW_CLASS : undefined}
						haptic="selection"
						onPress={() => onSelect("inherit")}
						testID="theme-option-font-inherit"
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Inherit</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Follows the body font</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				</ListGroup>
			) : null}

			{FONT_GROUPS.map((group) => (
				<View className="gap-2" key={group.type}>
					<Text.Overline>{group.label}</Text.Overline>
					<ListGroup isDivided={false} variant="transparent">
						{group.fonts.map((candidate) => (
							<ListGroup.Item
								className={selected === candidate.name ? AXIS_SELECTED_ROW_CLASS : undefined}
								haptic="selection"
								key={candidate.name}
								onPress={() => onSelect(candidate.name)}
								testID={`theme-option-font-${candidate.name}`}
							>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix>
									<FontPreview family={candidate.family} />
								</ListGroup.ItemSuffix>
							</ListGroup.Item>
						))}
					</ListGroup>
				</View>
			))}
		</View>
	);
}
FontOptionList.displayName = "Playground.FontOptionList";
