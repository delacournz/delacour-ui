import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "End icon",
};

export function Demo(): ReactElement {
	return (
		<Button testID="continue">
			<Button.Label>Continue</Button.Label>
			<Icon icon={IconArrowRight} />
		</Button>
	);
}
