import type { ReactElement } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { IconCircleX } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable } from "../pressable";
import { useSearchBarPart } from "./search-bar.context";
import { SEARCH_BAR_CLEAR_FADE_DURATION, SEARCH_BAR_CLEAR_HIT_SLOP, searchBarVariants } from "./search-bar.variants";

const ENTERING = FadeIn.duration(SEARCH_BAR_CLEAR_FADE_DURATION);
const EXITING = FadeOut.duration(SEARCH_BAR_CLEAR_FADE_DURATION);

/**
 * The clear button in the box's trailing slot.
 *
 * Empties the text and keeps focus, so the keyboard stays up for the next
 * query — clearing is the start of another search, not the end of this one.
 * The glyph inherits the decorator's icon step and muted colour from
 * `Input.Group.Suffix`, so it is sized by the field with nothing said here.
 *
 * Presses with `fade` and plays no haptic: it is tapped often, and a buzz on
 * every clear reads as noise.
 */
export function SearchBarClear(): ReactElement {
	const { clear, clearAccessibilityLabel, testID } = useSearchBarPart("SearchBar.Clear");

	return (
		<Animated.View entering={ENTERING} exiting={EXITING}>
			<Pressable
				accessibilityLabel={clearAccessibilityLabel}
				accessibilityRole="button"
				className={searchBarVariants().clear()}
				feedback="fade"
				hitSlop={SEARCH_BAR_CLEAR_HIT_SLOP}
				onPress={clear}
				testID={testID ? `${testID}-clear` : undefined}
			>
				<Icon icon={IconCircleX} />
			</Pressable>
		</Animated.View>
	);
}
SearchBarClear.displayName = "DelacourUI.SearchBar.Clear";
