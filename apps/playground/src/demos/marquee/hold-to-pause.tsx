import { Badge } from "@delacour/react-native-ui/badge";
import { Marquee } from "@delacour/react-native-ui/marquee";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hold to pause",
	caption:
		'The default pause is `{ kind: "press" }`: a finger down anywhere on the strip eases it to a stop over `easeMs`, and lifting it eases back up to speed from exactly where it was.',
	align: "stretch",
	capture: { align: "stretch", flow: true },
};

const ITEMS = ["Hold", "anywhere", "on", "the", "strip", "to", "stop", "it"] as const;

export function Demo(): ReactElement {
	return (
		<Marquee contentClassName="gap-2" easeMs={400} pause={{ kind: "press" }} speed={60} testID="marquee-hold-to-pause">
			{ITEMS.map((word) => (
				<Badge key={word} size="lg">
					{word}
				</Badge>
			))}
		</Marquee>
	);
}
