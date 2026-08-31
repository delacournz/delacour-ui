import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ColorPreview, FontPreview, RadiusPreview } from "@/components/customizer/previews";
import { BASE_COLORS } from "@/design-system/base-colors";
import type { DesignSystemConfig, PaletteName } from "@/design-system/config";
import { FONT_GROUPS } from "@/design-system/fonts";
import { RADII } from "@/design-system/radii";
import type { ResolvedMode } from "@/design-system/resolve";
import { STYLES } from "@/design-system/styles";

/** The axes that open a list of their own. `root` is the list of axes itself. */
export type OptionAxis = "style" | "baseColor" | "theme" | "chartColor" | "font" | "fontHeading" | "radius";

export type OptionPaneProps = {
	axis: OptionAxis;
	/** The palettes offered for the current base colour — the base itself, then every accent. */
	palettes: readonly { name: PaletteName; title: string }[];
	/** The corner the `default` radius would resolve to, which is the current style's. */
	styleRadius: number;
	/** What the design system would look like with one axis changed. */
	preview: (candidate: Partial<DesignSystemConfig>) => ResolvedMode;
	choose: <Key extends keyof DesignSystemConfig>(key: Key, value: DesignSystemConfig[Key]) => void;
};

const SWATCH_TOKENS = ["background", "primary", "accent", "destructive"] as const;
const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

/**
 * One axis's options, each row previewing what choosing it would do.
 *
 * Split from `Customizer` because seven option lists and the axis list in one
 * component is a function nobody can hold in their head — Biome's complexity
 * rule caught it at 34 against a limit of 15, which is the rule doing its job.
 *
 * Every preview resolves the WHOLE design system with that one axis changed,
 * rather than reading the option's own values: a base colour's `primary` is not
 * what `primary` becomes once an accent is spread over it, and a row that
 * lied about its own outcome would be worse than no preview.
 */
export function OptionPane({ axis, palettes, styleRadius, preview, choose }: OptionPaneProps): ReactElement {
	if (axis === "style") {
		return (
			<ListGroup>
				{STYLES.map((candidate) => (
					<ListGroup.Item haptic="selection" key={candidate.name} onPress={() => choose("style", candidate.name)}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>{candidate.description}</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<RadiusPreview radius={candidate.geometry.radius} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		);
	}

	if (axis === "baseColor") {
		return (
			<ListGroup>
				{BASE_COLORS.map((candidate) => (
					<ListGroup.Item haptic="selection" key={candidate.name} onPress={() => choose("baseColor", candidate.name)}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ColorPreview tokens={SWATCH_TOKENS} values={preview({ baseColor: candidate.name })} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		);
	}

	if (axis === "theme" || axis === "chartColor") {
		const isTheme = axis === "theme";

		return (
			<ListGroup>
				{palettes.map((candidate) => (
					<ListGroup.Item
						haptic="selection"
						key={candidate.name}
						onPress={() => (isTheme ? choose("theme", candidate.name) : choose("chartColor", candidate.name))}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ColorPreview
								tokens={isTheme ? ["primary"] : CHART_TOKENS}
								values={preview(isTheme ? { theme: candidate.name } : { chartColor: candidate.name })}
							/>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		);
	}

	if (axis === "radius") {
		return (
			<ListGroup>
				{RADII.map((candidate) => (
					<ListGroup.Item haptic="selection" key={candidate.name} onPress={() => choose("radius", candidate.name)}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
							{candidate.value === null ? (
								<ListGroup.ItemDescription>Whatever the style chose</ListGroup.ItemDescription>
							) : null}
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<RadiusPreview radius={candidate.value ?? styleRadius} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
		);
	}

	const isHeading = axis === "fontHeading";

	return (
		<View className="gap-3">
			{isHeading ? (
				<ListGroup>
					<ListGroup.Item haptic="selection" onPress={() => choose("fontHeading", "inherit")}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Inherit</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Follows the body font</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				</ListGroup>
			) : null}

			{FONT_GROUPS.map((group) => (
				<View className="gap-2" key={group.type}>
					<Text.Overline>{group.label}</Text.Overline>
					<ListGroup>
						{group.fonts.map((candidate) => (
							<ListGroup.Item
								haptic="selection"
								key={candidate.name}
								onPress={() => (isHeading ? choose("fontHeading", candidate.name) : choose("font", candidate.name))}
							>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix>
									<FontPreview family={candidate.family} />
								</ListGroup.ItemSuffix>
							</ListGroup.Item>
						))}
					</ListGroup>
				</View>
			))}
		</View>
	);
}
OptionPane.displayName = "Playground.Customizer.OptionPane";
