import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconArrowRotateClockwise, IconCloudOff } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading and disabled actions",
	caption:
		"An empty state holds no state of its own — the buttons inside it bring theirs. Retry spins for a moment; the second action stays disabled until a retry has run.",
	capture: { align: "stretch" },
};

const RETRY_MS = 1200;

export function Demo(): ReactElement {
	const [isRetrying, setRetrying] = useState(false);
	const [attempts, setAttempts] = useState(0);

	useEffect(() => {
		if (!isRetrying) return;
		const timer = setTimeout(() => {
			setRetrying(false);
			setAttempts((count) => count + 1);
		}, RETRY_MS);
		return () => clearTimeout(timer);
	}, [isRetrying]);

	return (
		<EmptyState testID="offline" variant="card">
			<EmptyState.Header>
				<EmptyState.Media variant="icon">
					<Icon icon={IconCloudOff} />
				</EmptyState.Media>
				<EmptyState.Title>You're offline</EmptyState.Title>
				<EmptyState.Description>
					{attempts === 0
						? "Check your connection, then try again."
						: `Still offline after ${attempts} ${attempts === 1 ? "attempt" : "attempts"}.`}
				</EmptyState.Description>
			</EmptyState.Header>
			<EmptyState.Content>
				<Button isLoading={isRetrying} onPress={() => setRetrying(true)} testID="retry">
					<Icon icon={IconArrowRotateClockwise} />
					<Button.Label>Retry</Button.Label>
				</Button>
				<Button isDisabled={attempts === 0 || isRetrying} testID="offline-mode" variant="outline">
					Work offline
				</Button>
			</EmptyState.Content>
		</EmptyState>
	);
}
