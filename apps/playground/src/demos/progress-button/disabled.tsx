import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "`isDisabled` fades the button and turns the gesture off, so the fill never starts.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<ProgressButton className="w-64" isDisabled testID="disabled" variant="destructive">
			Hold to erase
		</ProgressButton>
	);
}
