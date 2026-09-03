import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { Dimensions, View } from "react-native";
import type { DemoEntry } from "@/demos/types";

/** Roughly what one row occupies, for sizing the sheet to its own content. */
const ROW_HEIGHT = 52;
/** The title block above the rows, plus the sheet's own padding. */
const CHROME_HEIGHT = 96;
const MIN_FRACTION = 0.32;
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
 * scroll. One computed snap point costs a line and is right for both.
 *
 * **The title and the scroll view are siblings, not nested.** `BottomSheet.Content`
 * is a static padded box, so a scroll view inside one inherits no bounded height
 * and quietly stops scrolling — with eighteen demos that strands everything past
 * the tenth. The title therefore sits in a plain box carrying the sheet's own
 * gutter, and the scrollable takes the rest with `flex-1`.
 *
 * `Content` is not used for that box either: it pays the sheet's safe-area
 * bottom inset, which under a title would open a home-indicator-sized hole
 * between the heading and the first row. The scroll view owns that inset, and
 * owning it once is the whole reason it is the scroll view's to own.
 *
 * `enableDynamicSizing={false}` with an explicit snap point is what
 * `BottomSheet.ScrollView` needs — a dynamically sized sheet has no height for
 * its scrollable to fill.
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
	const screenHeight = Dimensions.get("window").height;
	const wanted = (CHROME_HEIGHT + demos.length * ROW_HEIGHT) / screenHeight;
	const fraction = Math.min(Math.max(wanted, MIN_FRACTION), MAX_FRACTION);
	const snapPoints = [`${Math.round(fraction * 100)}%`];

	const handleSelect = (index: number) => {
		onOpenChange(false);
		onSelect(index);
	};

	return (
		<BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container enableDynamicSizing={false} snapPoints={snapPoints}>
					<View className="px-screen-gutter pb-2 pt-2">
						<BottomSheet.Title>{title}</BottomSheet.Title>
					</View>
					<BottomSheet.ScrollView className="flex-1">
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
