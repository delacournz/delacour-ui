import { auditTheme, QUALITY_LIMITS, QUALITY_STATUS, type ThemeQualityResult } from "@delacour/design-system/quality";
import { resolveTokens } from "@delacour/design-system/resolve";
import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { useDesignSystem } from "@/design-system/store";

/** Use the same measurements that the web page exports. */
export function ThemeQuality(): ReactElement {
	const config = useDesignSystem();
	const results = useMemo(() => auditTheme(resolveTokens(config)), [config]);
	return (
		<View className="gap-3">
			<Text.Kicker>Theme quality</Text.Kicker>
			<Text.Caption color="muted">{QUALITY_LIMITS}</Text.Caption>
			{(["light", "dark"] as const).map((mode) => {
				const rows = results.filter((row) => row.mode === mode);
				const failed = rows.filter((row) => row.status === "fail").length;
				const unknown = rows.filter((row) => row.status === "unknown").length;
				return (
					<Collapsible key={mode}>
						<Collapsible.Trigger testID={`theme-quality-${mode}`}>
							<Collapsible.Title>{mode === "light" ? "Light" : "Dark"}</Collapsible.Title>
							<Collapsible.Description>{`${failed} below target · ${unknown} not measured`}</Collapsible.Description>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<View className="gap-4">
								{rows.map((row) => (
									<QualityRow key={row.label} row={row} />
								))}
							</View>
						</Collapsible.Content>
					</Collapsible>
				);
			})}
			<Text.Caption color="muted">
				Generate CSS opens the web customizer. Download the report there. Inspect the control states in Preview.
			</Text.Caption>
		</View>
	);
}
ThemeQuality.displayName = "Playground.Theme.Quality";

function QualityRow({ row }: { row: ThemeQualityResult }): ReactElement {
	return (
		<View className="gap-1">
			<Text.Label>{row.label}</Text.Label>
			<Text.Caption color={row.status === "fail" ? "destructive" : "muted"}>
				{`${QUALITY_STATUS[row.status]} · ${row.ratio === null ? "No ratio" : `${row.ratio.toFixed(2)}:1`} / ${row.minimum}:1`}
			</Text.Caption>
			<Text.Caption color="muted">{`--${row.foreground}: ${row.foregroundValue ?? "missing"}`}</Text.Caption>
			<Text.Caption color="muted">{`--${row.background}: ${row.backgroundValue ?? "missing"}`}</Text.Caption>
		</View>
	);
}
QualityRow.displayName = "Playground.Theme.QualityRow";
