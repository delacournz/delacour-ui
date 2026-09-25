import { Button } from "@delacour/react-native-ui/button";
import { Kpi } from "@delacour/react-native-ui/kpi";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading",
	caption:
		"`isLoading` holds a placeholder the size of each number and marks the card busy, so nothing jumps when the data lands. Refresh to watch it.",
};

const SIGNUPS = [120, 134, 128, 150, 162, 158, 171, 184] as const;
const DELAY_MS = 1500;

export function Demo(): ReactElement {
	const [isLoading, setLoading] = useState(true);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const refresh = (): void => {
		setLoading(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setLoading(false), DELAY_MS);
	};

	useEffect(() => {
		timer.current = setTimeout(() => setLoading(false), DELAY_MS);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	return (
		<View className="gap-4">
			<Kpi colorIndex={2} isLoading={isLoading} testID="kpi-loading">
				<Kpi.Header>
					<Kpi.Title>Sign-ups</Kpi.Title>
				</Kpi.Header>
				<Kpi.Content>
					<Kpi.Stat>
						<Kpi.Value>184</Kpi.Value>
						<Kpi.Trend caption="vs last week" value={13.6} />
					</Kpi.Stat>
					<Kpi.Sparkline data={SIGNUPS} />
				</Kpi.Content>
			</Kpi>
			<Button isLoading={isLoading} onPress={refresh} size="sm" testID="kpi-loading-refresh" variant="outline">
				Refresh
			</Button>
		</View>
	);
}
