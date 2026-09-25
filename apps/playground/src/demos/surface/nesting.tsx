import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMinusMedium, IconPlusMedium } from "@delacour/react-native-ui/icons/central";
import { Surface, type SurfaceVariant, useSurface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nesting",
	caption:
		"None of these surfaces names a variant. Each reads the one it sits in and steps to the next fill, so a panel inside a card never vanishes into it. Add and remove levels to watch it step.",
	capture: { align: "stretch", hero: true },
};

const MIN_DEPTH = 1;
const MAX_DEPTH = 5;
const INITIAL_DEPTH = 3;

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

/** Names the fill the surface around it resolved to — read from context, not passed down. */
function FillLabel({ level }: { level: number }): ReactElement {
	const { variant } = useSurface();

	return (
		<Text.Caption testID={`nesting-label-${level}`}>
			Level {level} · {LABELS[variant]}
		</Text.Caption>
	);
}

/** One surface per remaining level, each inside the last. */
function Level({ level, depth }: { level: number; depth: number }): ReactElement {
	return (
		<Surface className="gap-3" padding="sm" testID={`nesting-surface-${level}`}>
			<FillLabel level={level} />
			{level < depth ? <Level depth={depth} level={level + 1} /> : null}
		</Surface>
	);
}

export function Demo(): ReactElement {
	const [depth, setDepth] = useState(INITIAL_DEPTH);

	return (
		<View className="gap-4">
			<Level depth={depth} level={1} />
			<View className="flex-row items-center justify-center gap-3">
				<Button
					accessibilityLabel="Remove a level"
					isDisabled={depth <= MIN_DEPTH}
					onPress={() => setDepth((current) => current - 1)}
					size="icon-md"
					testID="nesting-remove"
					variant="secondary"
				>
					<Icon icon={IconMinusMedium} />
				</Button>
				<Text.Label testID="nesting-depth">{depth} levels</Text.Label>
				<Button
					accessibilityLabel="Add a level"
					isDisabled={depth >= MAX_DEPTH}
					onPress={() => setDepth((current) => current + 1)}
					size="icon-md"
					testID="nesting-add"
					variant="secondary"
				>
					<Icon icon={IconPlusMedium} />
				</Button>
			</View>
		</View>
	);
}
