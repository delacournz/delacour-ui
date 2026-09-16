import { Radio } from "@delacour/native-ui/radio";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal, wrapping",
};

const SCROLL_CHECK = ["one", "two", "three", "four", "five", "six", "seven", "eight"] as const;

export function Demo(): ReactElement {
	const [scrolled, setScrolled] = useState("one");

	return (
		<Radio.Group
			accessibilityLabel="Scroll check"
			onSelected={setScrolled}
			orientation="horizontal"
			selected={scrolled}
		>
			{SCROLL_CHECK.map((name) => (
				<Radio key={name} testID={`radio-${name}`} value={name}>
					{name}
				</Radio>
			))}
		</Radio.Group>
	);
}
