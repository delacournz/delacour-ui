import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AXIS_SELECTED_ROW_CLASS, AxisSheet, type AxisSheetControlProps } from "@/components/theme/axis-sheet";

/** The one row, the caption under it, and the room the caption needs. */
const ICON_LIBRARY_ROW_COUNT = 3;

/**
 * The one axis shadcn offers that this library cannot.
 *
 * `native-ui` rule 5 is "Central Icons only — never Lucide, Hugeicons, or
 * anything else", and rule 7 allows a single `withUniwind` wrapper, already
 * spent on the Central Icons proxy that covers the whole two-thousand-icon set.
 * A second icon set would cost both rules to gain a control this library has no
 * use for.
 *
 * **The row is pressable now, where it used to be inert.** An unpressable row
 * among seven pressable ones reads as a bug, and the reasoning above only
 * existed in a comment nobody reads on a device. Opening a sheet that says why
 * there is one option states the omission where the question is actually asked.
 *
 * It writes nothing — there is no `iconLibrary` key on `DesignSystemConfig` to
 * write — so it takes no `useAxisChoice`; choosing the only option is just a
 * dismissal.
 */
export function IconLibraryBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={ICON_LIBRARY_ROW_COUNT} title="Icon Library">
			<View className="gap-3">
				<ListGroup isDivided={false} variant="transparent">
					<ListGroup.Item
						className={AXIS_SELECTED_ROW_CLASS}
						haptic="selection"
						onPress={() => onOpenChange(false)}
						testID="theme-option-iconLibrary-central"
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Central</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Round, outlined, 1.5 stroke</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				</ListGroup>

				<Text.Caption>
					The only one. Central Icons covers the whole set this library draws from, and a second icon set would cost
					both the rule that keeps icons consistent and the single styling wrapper already spent on it. The axis is
					shown rather than dropped so the omission is stated rather than silently missing.
				</Text.Caption>
			</View>
		</AxisSheet>
	);
}
IconLibraryBottomSheet.displayName = "Playground.IconLibraryBottomSheet";
