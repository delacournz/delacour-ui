import { BUTTON_VARIANTS, Button, type ButtonSpinnerPlacement, type ButtonVariant } from "@delacour/native-ui/button";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading, every variant",
	caption: "Nothing is passed to the spinner — it reads the button's variant and size from context.",
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

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_VARIANTS.map((variant) => (
				<LoadingButton
					key={variant}
					label={variant}
					spinnerPlacement="start"
					testID={`loading-${variant}`}
					variant={variant}
				/>
			))}
		</View>
	);
}
