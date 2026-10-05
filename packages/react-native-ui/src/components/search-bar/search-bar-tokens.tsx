import type { ReactElement } from "react";
import { ScrollView } from "react-native";
import { Chip } from "../chip";
import { Icon } from "../icon";
import { useSearchBarPart } from "./search-bar.context";
import type { SearchBarToken } from "./search-bar.types";
import { SEARCH_BAR_TOKEN_CHIP_SIZE, searchBarVariants } from "./search-bar.variants";

export type SearchBarTokensProps = {
	tokens: readonly SearchBarToken[];
	onTokenRemove?: (token: SearchBarToken) => void;
};

/**
 * The active filters, as chips inside the box ahead of the text.
 *
 * A horizontal scroller capped at a share of the field's width, so a long list
 * of filters scrolls rather than squeezing the text to nothing. Taps inside it
 * are `handled`, so removing a chip never also dismisses the keyboard.
 *
 * Each chip is static apart from its remove control, which is its own
 * accessible element labelled with the token's name. A disabled bar draws the
 * chips without one.
 */
export function SearchBarTokens({ tokens, onTokenRemove }: SearchBarTokensProps): ReactElement {
	const { isDisabled, size, testID } = useSearchBarPart("SearchBar.Tokens");
	const slots = searchBarVariants();

	return (
		<ScrollView
			className={slots.tokens()}
			contentContainerClassName={slots.tokensContent()}
			horizontal
			keyboardShouldPersistTaps="handled"
			showsHorizontalScrollIndicator={false}
		>
			{tokens.map((token) => (
				<Chip
					className="self-center"
					closeAccessibilityLabel={`Remove ${token.label}`}
					closeTestID={testID ? `${testID}-token-${token.id}-remove` : undefined}
					isDisabled={isDisabled}
					key={token.id}
					onClose={onTokenRemove && !isDisabled ? () => onTokenRemove(token) : undefined}
					size={SEARCH_BAR_TOKEN_CHIP_SIZE[size]}
					testID={testID ? `${testID}-token-${token.id}` : undefined}
				>
					{token.icon ? <Icon icon={token.icon} /> : null}
					{token.label}
				</Chip>
			))}
		</ScrollView>
	);
}
SearchBarTokens.displayName = "DelacourUI.SearchBar.Tokens";
