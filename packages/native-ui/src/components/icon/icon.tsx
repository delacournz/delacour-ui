import type { ComponentType, ReactElement } from "react";
import type { SvgProps } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useIconDefaults } from "./icon.context";

export type IconComponent = ComponentType<SvgProps & { size?: number }>;

export type IconProps = Omit<SvgProps, "color" | "width" | "height"> & {
	/** An icon component from `@delacour/native-ui/icons/central`. */
	icon: IconComponent;
	/** Edge length in points. Defaults to the enclosing component's icon size. */
	size?: number;
	/**
	 * A theme colour token (`foreground`, `muted-foreground`, …) or a CSS
	 * variable name. Defaults to the enclosing component's icon colour.
	 */
	color?: string;
};

const FALLBACK_SIZE = 20;
const FALLBACK_COLOR = "foreground";

/**
 * Renders a Central Icon with a theme-aware colour.
 *
 * Icons take a `color` prop rather than a style, so they are not styled by a
 * className and must not be wrapped with uniwind's `withUniwind`. This resolves
 * the token to a concrete value through the active theme instead — one wrapper
 * for the whole icon set rather than one per icon.
 *
 * Size and colour fall back to the nearest {@link IconDefaultsProvider}, so an
 * icon composed into a Button matches that button's size and variant without
 * being told to.
 */
export function Icon({ icon: IconGlyph, size, color, ...props }: IconProps): ReactElement {
	const defaults = useIconDefaults();
	const resolvedSize = size ?? defaults?.size ?? FALLBACK_SIZE;
	const resolved = useThemeColor(color ?? defaults?.color ?? FALLBACK_COLOR);

	return <IconGlyph color={resolved} height={resolvedSize} size={resolvedSize} width={resolvedSize} {...props} />;
}
