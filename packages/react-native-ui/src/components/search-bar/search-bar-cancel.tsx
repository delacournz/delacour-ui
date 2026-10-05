import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useSearchBarPart } from "./search-bar.context";
import { SEARCH_BAR_CANCEL_BUTTON_SIZE } from "./search-bar.variants";

export type SearchBarCancelProps = Omit<ButtonProps, "size">;

/**
 * The Cancel action beside the field.
 *
 * A ghost `Button` at the field's own step, labelled with the bar's
 * `cancelLabel`. A press empties the text, blurs the field and dismisses the
 * keyboard, then ticks a `selection` haptic — the one press in the bar that
 * plays one, because it ends the search.
 *
 * Rendered by default whenever `cancel` is not `never`. Pass one as the bar's
 * child to change its label, variant or content; the bar still owns when it is
 * shown, and the press still cancels after a caller's own `onPress`.
 */
export function SearchBarCancel({
	variant = "ghost",
	haptic = "selection",
	onPress,
	children,
	testID,
	...props
}: SearchBarCancelProps): ReactElement {
	const { cancel, cancelLabel, size, testID: barTestID } = useSearchBarPart("SearchBar.Cancel");

	const handlePress = useCallback(() => {
		onPress?.();
		cancel();
	}, [cancel, onPress]);

	return (
		<Button
			haptic={haptic}
			onPress={handlePress}
			size={SEARCH_BAR_CANCEL_BUTTON_SIZE[size]}
			testID={testID ?? (barTestID ? `${barTestID}-cancel` : undefined)}
			variant={variant}
			{...props}
		>
			{children ?? cancelLabel}
		</Button>
	);
}
SearchBarCancel.displayName = "DelacourUI.SearchBar.Cancel";
