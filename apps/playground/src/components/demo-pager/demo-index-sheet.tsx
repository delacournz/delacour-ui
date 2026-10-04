import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { useWindowDimensions, View } from "react-native";
import type { DemoEntry } from "@/demos/types";

/**
 * The most of the window the list may take before it scrolls. A cap on the
 * content the sheet sizes itself to, not a snap point.
 */
const MAX_FRACTION = 0.85;

export type DemoIndexSheetProps = {
	title: string;
	demos: readonly DemoEntry[];
	activeIndex: number;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSelect: (index: number) => void;
};

/**
 * Every demo in the group, for jumping to a named one.
 *
 * The rail answers "where am I"; this answers "what else is there", and it is
 * the only thing that answers it. Splitting the two is what lets the rail stay
 * a two-point rule in the header instead of growing into a menu — and what
 * keeps every jump on one control rather than two that overlap.
 *
 * **Sized to its own content, capped.** A fixed percentage is wrong at both
 * ends of this library: Spinner has three demos and would open onto half a
 * screen of nothing, Button has eighteen and would open already needing a
 * scroll. The scroll view reports its content size and that is the sheet's one
 * snap point, up to `maxDynamicContentSize`; the engine counts the handle and the
 * safe-area band itself, so no row is measured and no chrome is budgeted for.
 * A row's height still moves with the Style axis — Mira packs, Maia spreads —
 * and the measurement follows it for free.
 *
 * **The title scrolls with the rows.** A sibling above the scroll view would be
 * height the content measurement never sees, and the last rows would land
 * under the fold by that much.
 *
 * Rows are `transparent`: a `ListGroup` card inside a sheet is a surface drawn
 * on a surface, which is the thing that made this read as a list dropped into a
 * panel rather than as the panel's own content. The current demo is marked by
 * filling its row rather than by a tick in the margin — the fill is legible at
 * a glance from anywhere in the list, and it survives the row being read by
 * someone who does not know what the tick would have meant.
 *
 * Numbering is not decoration. It is the same count the rail draws, in words,
 * so "the ninth of eighteen" reads the same in both places.
 */
export function DemoIndexSheet({
	title,
	demos,
	activeIndex,
	isOpen,
	onOpenChange,
	onSelect,
}: DemoIndexSheetProps): ReactElement {
	const { height } = useWindowDimensions();

	const handleSelect = (index: number) => {
		onOpenChange(false);
		onSelect(index);
	};

	return (
		<BottomSheet isOpen={isOpen} maxDynamicContentSize={height * MAX_FRACTION} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.ScrollView>
						<BottomSheet.Title>{title}</BottomSheet.Title>
						<ListGroup isDivided={false} variant="transparent">
							{demos.map((demo, index) => (
								<ListGroup.Item
									className={index === activeIndex ? "rounded-lg bg-secondary" : undefined}
									haptic="selection"
									key={demo.id}
									onPress={() => handleSelect(index)}
									testID={`demo-index-${demo.id}`}
								>
									<ListGroup.ItemPrefix>
										<View className="w-6">
											<Text.Caption color={index === activeIndex ? "default" : "muted"}>
												{String(index + 1).padStart(2, "0")}
											</Text.Caption>
										</View>
									</ListGroup.ItemPrefix>
									<ListGroup.ItemContent>
										<ListGroup.ItemTitle>{demo.title}</ListGroup.ItemTitle>
									</ListGroup.ItemContent>
								</ListGroup.Item>
							))}
						</ListGroup>
					</BottomSheet.ScrollView>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
