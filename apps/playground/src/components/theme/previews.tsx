import { Text } from "@delacour/native-ui/text";
import { formatHex, formatHex8, parse } from "culori";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { ResolvedMode } from "@/design-system/resolve";

/**
 * The four tokens that tell two palettes apart at a glance, and the five a
 * chart palette is.
 *
 * They live beside `ColorPreview` because they are the argument it is almost
 * always given — the screen's summary rows and the two palette sheets all reach
 * for the same pair, and three copies of the same five strings is how one of
 * them ends up a token behind.
 */
export const SWATCH_TOKENS = ["background", "primary", "accent", "destructive"] as const;
export const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

/**
 * An `oklch()` string, as something React Native can actually paint.
 *
 * Exported because the axis strips paint their tiles from resolved token values
 * directly rather than through `ColorPreview`, and every one of those values is
 * an `oklch()` string React Native would silently decline to draw.
 *
 * The palette is stored in shadcn's own notation so a web theme can be pasted
 * in unchanged, and React Native understands none of it — an `oklch(...)` given
 * to `backgroundColor` renders as nothing at all, with no error. Uniwind solves
 * this for real component styling by running every variable through culori on
 * its way into the store; a preview paints from literals that never take that
 * path, so it has to do the same conversion itself. Same library, deliberately,
 * so a colour cannot look different here than it does on the component.
 */
export function paintable(value: string | number | undefined): string | undefined {
	// The resolved map carries geometry alongside colour, and a number is never
	// a colour — reaching for `--radius` here is a bug in the caller, not a
	// value to coerce.
	if (typeof value !== "string" || !value) return undefined;

	const parsed = parse(value);
	if (!parsed) return value;

	return parsed.alpha === undefined || parsed.alpha === 1 ? formatHex(parsed) : formatHex8(parsed);
}

/**
 * A palette, as overlapping discs.
 *
 * Painted from literal values rather than through `useThemeColor`, which
 * resolves against the design system that is CURRENTLY applied — every row
 * would show the active palette and the picker would be useless. This is the
 * one place in the app that legitimately paints from literals.
 */
export function ColorPreview({ values, tokens }: { values: ResolvedMode; tokens: readonly string[] }): ReactElement {
	return (
		<View className="flex-row items-center">
			{tokens.map((token, index) => (
				<View
					className="size-icon-lg rounded-full border border-border/40"
					key={token}
					style={{ backgroundColor: paintable(values[token]), marginLeft: index === 0 ? 0 : -8 }}
				/>
			))}
		</View>
	);
}
ColorPreview.displayName = "Playground.ColorPreview";

/**
 * A typeface, showing itself.
 *
 * `fontFamily` is set inline because the family is chosen at runtime and
 * Tailwind's scanner is static — a `font-[Outfit]` built from a variable is
 * never compiled and would silently draw nothing. It is also the only honest
 * preview: a family name in the system font tells you nothing about the family.
 */
export function FontPreview({ family }: { family: string }): ReactElement {
	return (
		<Text className="text-muted-foreground text-xl" style={{ fontFamily: family }}>
			Aa
		</Text>
	);
}
FontPreview.displayName = "Playground.FontPreview";

/** A corner, at the size it would actually draw. */
export function RadiusPreview({ radius }: { radius: number }): ReactElement {
	return (
		<View
			className="size-icon-xl border-2 border-muted-foreground/60"
			style={{ borderBottomWidth: 0, borderLeftWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: radius }}
		/>
	);
}
RadiusPreview.displayName = "Playground.RadiusPreview";
