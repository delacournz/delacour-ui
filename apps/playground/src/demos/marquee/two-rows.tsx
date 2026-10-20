import { Badge } from "@delacour/react-native-ui/badge";
import { Marquee } from "@delacour/react-native-ui/marquee";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Two rows in step",
	caption:
		"Two strips in one `Marquee.Group`, drifting opposite ways at the group's speed. A finger on either row holds both.",
	align: "stretch",
	capture: { align: "stretch", flow: "marquee/two-rows", hero: true },
};

const TOP = ["React Native", "Expo", "Reanimated", "Gesture Handler", "Skia", "SVG"] as const;
const BOTTOM = ["iOS", "Android", "Dark mode", "Dynamic type", "RTL", "Haptics"] as const;

export function Demo(): ReactElement {
	return (
		<Marquee.Group className="gap-3" speed={30} testID="marquee-two-rows">
			<Marquee
				direction="left"
				fade={{ kind: "edges" }}
				contentClassName="gap-2"
				gap="sm"
				testID="marquee-two-rows-top"
			>
				{TOP.map((label) => (
					<Badge key={label} variant="outline">
						{label}
					</Badge>
				))}
			</Marquee>
			<Marquee
				direction="right"
				fade={{ kind: "edges" }}
				contentClassName="gap-2"
				gap="sm"
				testID="marquee-two-rows-bottom"
			>
				{BOTTOM.map((label) => (
					<Badge color="primary" key={label} variant="soft">
						{label}
					</Badge>
				))}
			</Marquee>
		</Marquee.Group>
	);
}
