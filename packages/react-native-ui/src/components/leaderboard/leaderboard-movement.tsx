import type { ReactElement } from "react";
import { View } from "react-native";
import { IconArrowTriangleBottom, IconArrowTriangleTop } from "../../icons/central";
import { Icon } from "../icon";
import { Text } from "../text";
import { LEADERBOARD_MOVEMENT_COLOR, leaderboardVariants, resolveMovement } from "./leaderboard.variants";

export type LeaderboardMovementProps = {
	/** The entry's `change` — places moved since the last period. */
	change: number | undefined;
};

/**
 * The movement column: ▲ and the places climbed in the success tone, ▼ and the
 * places fallen in the destructive one, and a dash for no change.
 *
 * An entry with no `change` on a board where others have one still reserves
 * the column, so its value lines up with theirs. The row's accessibility label
 * already says the movement in words, so this is never read on its own.
 */
export function LeaderboardMovement({ change }: LeaderboardMovementProps): ReactElement {
	const movement = resolveMovement(change);
	const slots = leaderboardVariants({ movement: movement.kind });

	if (movement.kind === "none") {
		return <View className={slots.movement()} />;
	}

	if (movement.kind === "same") {
		return (
			<View className={slots.movement()}>
				<Text className={slots.movementText()}>–</Text>
			</View>
		);
	}

	const glyph = movement.kind === "up" ? IconArrowTriangleTop : IconArrowTriangleBottom;

	return (
		<View className={slots.movement()}>
			<Icon color={LEADERBOARD_MOVEMENT_COLOR[movement.kind]} icon={glyph} size="xs" />
			<Text className={slots.movementText()}>{movement.places}</Text>
		</View>
	);
}
LeaderboardMovement.displayName = "DelacourUI.Leaderboard.Movement";
