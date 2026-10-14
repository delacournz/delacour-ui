import type { ThemeSelectorSize, ThemeSelectorVariant } from "./theme-selector.variants";

/** The axes the root resolves once and every option reads. */
export type ThemeSelectorAxes = {
	variant: ThemeSelectorVariant;
	size: ThemeSelectorSize;
	isDisabled: boolean;
};
