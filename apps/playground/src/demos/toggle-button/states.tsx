import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and loading",
	caption:
		"Disabled fades the toggle in either state and ignores presses. Loading keeps full contrast, blocks presses and announces the toggle as busy — tap Follow to see the round trip.",
	align: "center",
};

/** How long the pretend request takes. */
const REQUEST_MS = 1200;

export function Demo(): ReactElement {
	const [isFollowing, setIsFollowing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const follow = (next: boolean) => {
		setIsLoading(true);
		setTimeout(() => {
			setIsFollowing(next);
			setIsLoading(false);
		}, REQUEST_MS);
	};

	return (
		<View className="gap-3">
			<View className="flex-row gap-3">
				<ToggleButton className="w-36" isDisabled testID="state-disabled-off">
					Disabled
				</ToggleButton>
				<ToggleButton className="w-36" defaultSelected isDisabled testID="state-disabled-on">
					Disabled
				</ToggleButton>
			</View>
			<ToggleButton
				isLoading={isLoading}
				isSelected={isFollowing}
				onSelected={follow}
				testID="state-follow"
				variant="outline"
			>
				{isFollowing ? "Following" : "Follow"}
			</ToggleButton>
		</View>
	);
}
