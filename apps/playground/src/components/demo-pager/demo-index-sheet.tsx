import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconBulletList, IconCheckmark1Small } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { type ReactElement, useState } from "react";
import type { DemoEntry } from "@/demos/types";

const SNAP_POINTS = ["55%", "90%"];

export type DemoIndexSheetProps = {
	demos: readonly DemoEntry[];
	activeIndex: number;
	onSelect: (index: number) => void;
};

/**
 * Every demo in the group, in one list, for jumping to a named one.
 *
 * The rail says where you are and scrubs; this says what there is. Splitting
 * the two is what lets the rail stay small enough to live in the chrome — at
 * eighteen demos a tick is three points tall, which is a position indicator and
 * not a control.
 *
 * Built from `BottomSheet` and `ListGroup` rather than hand-rolled, because the
 * whole point of this app is that the library renders its own harness: a bug in
 * either shows up here before it reaches a gallery.
 *
 * `enableDynamicSizing={false}` with explicit snap points is what
 * `BottomSheet.ScrollView` needs — a dynamically sized sheet has no height for
 * its scrollable to fill, and Input's twenty-two demos would run off the bottom.
 *
 * The sheet is closed before the scroll rather than after it: the jump is
 * instant on the UI thread, and closing second would animate the sheet away
 * over a demo that had already changed.
 *
 * The trigger is `primary` rather than something quieter. It is the only
 * control in the chrome, and a `secondary` fill sits a shade off the background
 * in both themes — restraint that reads as a bug. Solid neutral is the loudest
 * this palette gets without borrowing a hue from the components on the stage,
 * which are the only things on this screen entitled to one.
 */
export function DemoIndexSheet({ demos, activeIndex, onSelect }: DemoIndexSheetProps): ReactElement {
	const [isOpen, setOpen] = useState(false);

	const handleSelect = (index: number) => {
		setOpen(false);
		onSelect(index);
	};

	return (
		<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
			<BottomSheet.Trigger asChild>
				<Button className="rounded-full" isIconOnly variant="primary">
					<Icon icon={IconBulletList} />
				</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
					<BottomSheet.ScrollView>
						<ListGroup>
							{demos.map((demo, index) => (
								<ListGroup.Item
									haptic="selection"
									key={demo.id}
									onPress={() => handleSelect(index)}
									testID={`demo-index-${demo.id}`}
								>
									<ListGroup.ItemContent>
										<ListGroup.ItemTitle>{demo.title}</ListGroup.ItemTitle>
									</ListGroup.ItemContent>
									{index === activeIndex ? (
										<ListGroup.ItemSuffix>
											<Icon icon={IconCheckmark1Small} />
										</ListGroup.ItemSuffix>
									) : null}
								</ListGroup.Item>
							))}
						</ListGroup>
					</BottomSheet.ScrollView>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
