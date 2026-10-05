import { Button } from "@delacour/react-native-ui/button";
import { StackCard, type StackCardDirection, type StackCardHandle } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, with a decline",
	caption:
		"A controlled deck that leaves `index` where it was declines the throw, and the card flies back. Here a throw to the left asks first: **No** keeps the card, **Yes** throws it again through the ref and lets it go.",
	capture: { align: "stretch", flow: "stack-card/controlled-decline" },
};

const FILES = ["holiday.mov", "draft-v3.key", "receipts-2025.zip", "old-backup.dmg"] as const;

export function Demo(): ReactElement {
	const deck = useRef<StackCardHandle>(null);
	const thrown = useRef<StackCardDirection>("right");
	const confirmed = useRef(false);
	const [index, setIndex] = useState(0);
	const [asking, setAsking] = useState<string | null>(null);

	const handleIndexChange = (next: number) => {
		const isDelete = next > index && thrown.current === "left";
		if (isDelete && !confirmed.current) {
			setAsking(FILES[index]);
			return;
		}
		confirmed.current = false;
		setIndex(next);
	};

	return (
		<View className="gap-4">
			<StackCard
				className="h-[360px]"
				directionLabels={{ left: "Delete", right: "Keep" }}
				index={index}
				onIndexChange={handleIndexChange}
				onSwipe={(direction) => {
					thrown.current = direction;
				}}
				ref={deck}
				testID="decline-deck"
			>
				<StackCard.Stamp color="destructive" direction="left">
					Delete
				</StackCard.Stamp>
				<StackCard.Stamp color="success" direction="right">
					Keep
				</StackCard.Stamp>
				{FILES.map((file) => (
					<StackCard.Card
						className="items-center justify-center p-6"
						key={file}
						testID={`decline-card-${file.split(".")[0]}`}
					>
						<Text variant="header">{file}</Text>
					</StackCard.Card>
				))}
				<StackCard.Empty>Nothing left to sort</StackCard.Empty>
			</StackCard>
			{asking ? (
				<View className="items-center gap-3">
					<Text align="center">Delete {asking} for good?</Text>
					<View className="flex-row gap-3">
						<Button onPress={() => setAsking(null)} testID="decline-no" variant="secondary">
							No
						</Button>
						<Button
							onPress={() => {
								setAsking(null);
								confirmed.current = true;
								deck.current?.swipe("left");
							}}
							testID="decline-yes"
							variant="destructive"
						>
							Yes
						</Button>
					</View>
				</View>
			) : (
				<Text align="center" variant="caption">
					Throw left to delete — it asks first
				</Text>
			)}
		</View>
	);
}
