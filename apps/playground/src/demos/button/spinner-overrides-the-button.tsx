import { Button } from "@delacour/native-ui/button";
import { Spinner } from "@delacour/native-ui/spinner";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Spinner overrides the button",
	caption: "An explicit colour on a composed spinner still wins over the button's context.",
};

export function Demo(): ReactElement {
	return (
		<Button testID="explicit-pink" variant="primary">
			<Spinner color="#EC4899" />
			<Button.Label>Explicit pink</Button.Label>
		</Button>
	);
}
