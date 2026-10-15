import { Compare } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	caption:
		"`Compare.Before` sits on the leading side, `Compare.After` behind it, and `Compare.Handle` is the seam between them. A `Compare.Label` pins a caption to its side and fades as the seam covers it. Drag the handle — both layers stay in register, because only a mask moves.",
	capture: { align: "stretch", flow: "compare/anatomy", hero: true },
};

/** One composition, drawn twice: flat on the left, finished on the right. */
function Scene({ isFinished }: { isFinished: boolean }): ReactElement {
	return (
		<View className={isFinished ? "flex-1 gap-3 bg-primary p-5" : "flex-1 gap-3 bg-muted p-5"}>
			<View className={isFinished ? "h-24 rounded-lg bg-primary-foreground/20" : "h-24 rounded-lg bg-border"} />
			<Text.Title className={isFinished ? "text-primary-foreground" : "text-muted-foreground"}>
				Harbour at dusk
			</Text.Title>
			<View
				className={isFinished ? "h-3 w-2/3 rounded-full bg-primary-foreground/40" : "h-3 w-2/3 rounded-full bg-border"}
			/>
			<View
				className={isFinished ? "h-3 w-1/2 rounded-full bg-primary-foreground/40" : "h-3 w-1/2 rounded-full bg-border"}
			/>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<Compare accessibilityLabel="Harbour at dusk" className="aspect-[4/3]">
			<Compare.Before>
				<Scene isFinished={false} />
			</Compare.Before>
			<Compare.After>
				<Scene isFinished />
			</Compare.After>
			<Compare.Label side="before">Draft</Compare.Label>
			<Compare.Label side="after">Final</Compare.Label>
			<Compare.Handle testID="compare-anatomy-handle" />
		</Compare>
	);
}
