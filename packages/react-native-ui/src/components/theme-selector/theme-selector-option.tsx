import type { ReactElement } from "react";
import { IconCircleHalfFill, IconMoon, IconSun } from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { ToggleButton } from "../toggle-button";
import { useThemeSelectorPart } from "./theme-selector.context";
import { resolveModeLabel, type ThemeMode } from "./theme-selector.logic";
import { resolveOptionHitSlop, themeSelectorVariants } from "./theme-selector.variants";

/** The glyph each mode draws when an option names none. */
const THEME_MODE_ICONS: Record<ThemeMode, IconComponent> = {
	system: IconCircleHalfFill,
	light: IconSun,
	dark: IconMoon,
};

export type ThemeSelectorOptionProps = {
	/** The mode this option selects. */
	value: ThemeMode;
	/** Overrides the label — and the selector's `labels` — for this one option. */
	label?: string;
	/** Overrides the mode's default glyph. */
	icon?: IconComponent;
	className?: string;
	testID?: string;
};

/**
 * One choice in a `ThemeSelector`: a `ToggleButton` holding a glyph and a label.
 *
 * Everything else comes from the selector — the variant's layout, the size, the
 * disabled state — and the selection itself from the group the root renders.
 * The glyph is decoration; the label is what a screen reader announces, as a
 * radio that is selected or not.
 */
export function ThemeSelectorOption({ value, label, icon, className, testID }: ThemeSelectorOptionProps): ReactElement {
	const { variant, size, labels } = useThemeSelectorPart("ThemeSelector.Option");
	const slots = themeSelectorVariants({ size, variant });
	const text = label?.trim() ? label : resolveModeLabel(value, labels);

	return (
		<ToggleButton
			className={slots.option({ className })}
			hitSlop={resolveOptionHitSlop(size)}
			testID={testID}
			value={value}
		>
			<Icon className={slots.icon()} icon={icon ?? THEME_MODE_ICONS[value]} />
			<ToggleButton.Label>{text}</ToggleButton.Label>
		</ToggleButton>
	);
}
ThemeSelectorOption.displayName = "DelacourUI.ThemeSelector.Option";
