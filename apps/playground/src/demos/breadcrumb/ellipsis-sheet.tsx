import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Ellipsis opens a sheet",
	caption:
		"With `onEllipsisPress` the ellipsis is a button, handed the hidden levels' indices. Here it lists them in a bottom sheet; pick one to jump there.",
	capture: { flow: "breadcrumb/ellipsis-sheet", frame: "device", hero: true },
};

const INITIAL = ["Home", "Music", "Artists", "Radiohead", "Albums", "In Rainbows", "Reckoner"] as const;

export function Demo(): ReactElement {
	const [depth, setDepth] = useState<number>(INITIAL.length);
	const [hidden, setHidden] = useState<readonly number[]>([]);
	const [isOpen, setOpen] = useState(false);
	const trail = INITIAL.slice(0, depth);

	const goTo = (index: number) => {
		setDepth(index + 1);
		setOpen(false);
	};

	return (
		<View className="flex-1 items-center justify-center gap-4">
			<Breadcrumb>
				<Breadcrumb.List
					maxItems={3}
					onEllipsisPress={(indices) => {
						setHidden(indices);
						setOpen(true);
					}}
					testID="breadcrumb-ellipsis-list"
				>
					{trail.map((crumb, index) => (
						<Breadcrumb.Item key={crumb}>
							{index === trail.length - 1 ? (
								<Breadcrumb.Page>{crumb}</Breadcrumb.Page>
							) : (
								<Breadcrumb.Link onPress={() => goTo(index)} testID={`breadcrumb-ellipsis-${index}`}>
									{crumb}
								</Breadcrumb.Link>
							)}
						</Breadcrumb.Item>
					))}
				</Breadcrumb.List>
			</Breadcrumb>
			<Button
				isDisabled={depth === INITIAL.length}
				onPress={() => setDepth(INITIAL.length)}
				size="sm"
				testID="breadcrumb-ellipsis-reset"
				variant="outline"
			>
				Back to the track
			</Button>
			<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container testID="breadcrumb-ellipsis-sheet">
						<BottomSheet.Content className="gap-2 pb-6">
							<BottomSheet.Title>Hidden levels</BottomSheet.Title>
							{hidden.map((index) => (
								<Button
									key={INITIAL[index]}
									onPress={() => goTo(index)}
									testID={`breadcrumb-ellipsis-sheet-${index}`}
									variant="ghost"
								>
									{INITIAL[index]}
								</Button>
							))}
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
