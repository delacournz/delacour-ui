import { BUTTON_SIZES, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconPlusMedium } from "@delacour/native-ui/icons/central";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading, every size",
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

function SizedLoadingButton({ size }: { size: (typeof BUTTON_SIZES)[number] }): ReactElement {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button isLoading={isLoading} onPress={start} size={size} testID={`loading-${size}`}>
			<Icon icon={IconPlusMedium} />
			<Button.Label>size {size}</Button.Label>
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_SIZES.map((size) => (
				<SizedLoadingButton key={size} size={size} />
			))}
		</View>
	);
}
