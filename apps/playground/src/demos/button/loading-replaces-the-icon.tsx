import { Button, type ButtonSpinnerPlacement } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconHeart } from "@delacour/native-ui/icons/central";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading replaces the icon",
	caption:
		"The spinner takes the icon's place rather than joining it, so the label does not move. Both are drawn at the button's icon token, so the swap costs no layout. With an icon at each end, the placement decides which one goes.",
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

function SwapButton({
	spinnerPlacement,
	label,
	both = false,
	testID,
}: {
	spinnerPlacement: ButtonSpinnerPlacement;
	label: string;
	both?: boolean;
	testID: string;
}): ReactElement {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button isLoading={isLoading} onPress={start} spinnerPlacement={spinnerPlacement} testID={testID}>
			{both || spinnerPlacement === "start" ? <Icon icon={IconHeart} /> : null}
			<Button.Label>{label}</Button.Label>
			{both || spinnerPlacement === "end" ? <Icon icon={IconArrowRight} /> : null}
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<SwapButton label="Start icon" spinnerPlacement="start" testID="swap-start" />
			<SwapButton label="End icon" spinnerPlacement="end" testID="swap-end" />
			<SwapButton both label="Both, start wins" spinnerPlacement="start" testID="swap-both-start" />
			<SwapButton both label="Both, end wins" spinnerPlacement="end" testID="swap-both-end" />
		</View>
	);
}
