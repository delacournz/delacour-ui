import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement, ReactNode } from "react";
import type { OptionAxis } from "@/components/customizer/option-pane";
import { ColorPreview, FontPreview, RadiusPreview } from "@/components/customizer/previews";
import { BASE_COLORS } from "@/design-system/base-colors";
import type { DesignSystemConfig, PaletteName } from "@/design-system/config";
import { fontByName } from "@/design-system/fonts";
import { radiusByName } from "@/design-system/radii";
import type { ResolvedMode } from "@/design-system/resolve";
import { styleByName } from "@/design-system/styles";

const SWATCH_TOKENS = ["background", "primary", "accent", "destructive"] as const;
const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

/** One row: the axis's name, its current value, and what that value looks like. */
function AxisRow({
	label,
	value,
	preview,
	onPress,
}: {
	label: string;
	value: string;
	preview: ReactNode;
	onPress?: () => void;
}): ReactElement {
	return (
		<ListGroup.Item haptic={onPress ? "selection" : undefined} onPress={onPress}>
			<ListGroup.ItemContent>
				<ListGroup.ItemDescription>{label}</ListGroup.ItemDescription>
				<ListGroup.ItemTitle>{value}</ListGroup.ItemTitle>
			</ListGroup.ItemContent>
			{preview ? <ListGroup.ItemSuffix>{preview}</ListGroup.ItemSuffix> : null}
		</ListGroup.Item>
	);
}
AxisRow.displayName = "Playground.Customizer.AxisRow";

export type AxisListProps = {
	config: DesignSystemConfig;
	/** The design system as it currently resolves, in the active mode. */
	resolved: ResolvedMode;
	palettes: readonly { name: PaletteName; title: string }[];
	open: (axis: OptionAxis) => void;
};

/**
 * The eight axes, each showing what it is set to.
 *
 * Grouped the way shadcn groups them — palette, type, then the two that are
 * neither — rather than in one flat list, because eight rows with no seam reads
 * as a settings screen instead of a set of related decisions.
 *
 * **Icon Library is the one axis shadcn offers that this library cannot**, and
 * its row takes no `onPress`. Rule 5 is "Central Icons only — never Lucide,
 * Hugeicons, or anything else", and rule 7's single `withUniwind` wrapper is
 * already spent on the Central Icons proxy that covers the whole set; a second
 * icon set would cost both rules to gain a control this library has no use for.
 * The row is kept so the omission is stated rather than silently missing.
 */
export function AxisList({ config, resolved, palettes, open }: AxisListProps): ReactElement {
	const style = styleByName(config.style);
	const radius = radiusByName(config.radius);
	const bodyFont = fontByName(config.font);
	const headingFont = config.fontHeading === "inherit" ? bodyFont : fontByName(config.fontHeading);
	const baseColor = BASE_COLORS.find((base) => base.name === config.baseColor);
	const titleOf = (name: PaletteName) => palettes.find((palette) => palette.name === name)?.title ?? name;

	return (
		<>
			<ListGroup>
				<AxisRow
					label="Style"
					onPress={() => open("style")}
					preview={<RadiusPreview radius={style?.geometry.radius ?? 0} />}
					value={style?.title ?? config.style}
				/>
				<AxisRow
					label="Base Color"
					onPress={() => open("baseColor")}
					preview={<ColorPreview tokens={SWATCH_TOKENS} values={resolved} />}
					value={baseColor?.title ?? config.baseColor}
				/>
				<AxisRow
					label="Theme"
					onPress={() => open("theme")}
					preview={<ColorPreview tokens={["primary"]} values={resolved} />}
					value={titleOf(config.theme)}
				/>
				<AxisRow
					label="Chart Color"
					onPress={() => open("chartColor")}
					preview={<ColorPreview tokens={CHART_TOKENS} values={resolved} />}
					value={titleOf(config.chartColor)}
				/>
			</ListGroup>

			<ListGroup>
				<AxisRow
					label="Heading"
					onPress={() => open("fontHeading")}
					preview={<FontPreview family={headingFont?.family ?? ""} />}
					value={headingFont?.title ?? "Inherit"}
				/>
				<AxisRow
					label="Font"
					onPress={() => open("font")}
					preview={<FontPreview family={bodyFont?.family ?? ""} />}
					value={bodyFont?.title ?? config.font}
				/>
			</ListGroup>

			<ListGroup>
				<AxisRow label="Icon Library" preview={null} value="Central" />
				<AxisRow
					label="Radius"
					onPress={() => open("radius")}
					preview={<RadiusPreview radius={Number(resolved.radius ?? 0)} />}
					value={radius?.title ?? config.radius}
				/>
			</ListGroup>
		</>
	);
}
AxisList.displayName = "Playground.Customizer.AxisList";
