import { Badge } from "@delacour/react-native-ui/badge";
import { Marquee } from "@delacour/react-native-ui/marquee";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A strip of badges",
	caption:
		"Badges drifting left at 40 points per second, dissolving into the background at both edges. Hold a finger on the strip and it eases to a stop.",
	align: "stretch",
};

const TAGS = ["Design", "Motion", "Typography", "Colour", "Layout", "Accessibility", "Tokens", "Haptics"] as const;

export function Demo(): ReactElement {
	return (
		<Marquee fade={{ kind: "edges", size: 40 }} contentClassName="gap-2" gap="sm" speed={40} testID="marquee-badges">
			{TAGS.map((tag) => (
				<Badge key={tag} variant="soft">
					{tag}
				</Badge>
			))}
		</Marquee>
	);
}
