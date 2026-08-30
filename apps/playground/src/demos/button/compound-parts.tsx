import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconHeart } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Compound parts",
	caption:
		"Reach for `Button.StartContent`, `Button.Label` and `Button.EndContent` by hand when a slot needs its own colour or spacing.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Button testID="compound" variant="outline">
			<Button.StartContent>
				<Icon color="danger" icon={IconHeart} size={18} />
			</Button.StartContent>
			<Button.Label className="text-danger">Custom label colour</Button.Label>
			<Button.EndContent>
				<Icon color="muted-foreground" icon={IconArrowRight} size={18} />
			</Button.EndContent>
		</Button>
	);
}
