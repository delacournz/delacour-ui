import {
	BUTTON_SPINNER_PLACEMENTS,
	Button,
	type ButtonSpinnerPlacement,
	type ButtonVariant,
} from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconHeart } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Spinner placement",
	caption:
		"`only` drops the label but keeps the button's footprint — these stay full width while loading. Pair it with `isIconOnly` for a square.",
};

/**
 * A loading flag that switches itself back off.
 *
 * The interesting part of `isLoading` is the transition in *and* out — a flag
 * that stays on only ever exercises half of it.
 */
function useTransientLoading(durationMs = 2500): [boolean, () => void] {
	const [isLoading, setIsLoading] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[]
	);

	const start = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		setIsLoading(true);
		timer.current = setTimeout(() => setIsLoading(false), durationMs);
	}, [durationMs]);

	return [isLoading, start];
}

function LoadingButton({
	spinnerPlacement,
	isDimmedWhileLoading = false,
	variant = "primary",
	label,
	testID,
}: {
	spinnerPlacement: ButtonSpinnerPlacement;
	isDimmedWhileLoading?: boolean;
	variant?: ButtonVariant;
	label: string;
	testID: string;
}): ReactElement {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button
			isDimmedWhileLoading={isDimmedWhileLoading}
			isLoading={isLoading}
			onPress={start}
			spinnerPlacement={spinnerPlacement}
			testID={testID}
			variant={variant}
		>
			{label}
		</Button>
	);
}

function IconOnlyLoadingButton(): ReactElement {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button
			accessibilityLabel="Favourite"
			isIconOnly
			isLoading={isLoading}
			onPress={start}
			spinnerPlacement="only"
			testID="icon-only-loading"
		>
			<Icon icon={IconHeart} />
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="gap-3">
				{BUTTON_SPINNER_PLACEMENTS.map((placement) => (
					<LoadingButton
						key={placement}
						label={`placement ${placement}`}
						spinnerPlacement={placement}
						testID={`placement-${placement}`}
					/>
				))}
			</View>
			<View className="flex-row items-center gap-3">
				<IconOnlyLoadingButton />
				<Text.Caption>isIconOnly + only</Text.Caption>
			</View>
		</View>
	);
}
