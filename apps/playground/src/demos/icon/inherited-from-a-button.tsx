import { BUTTON_SIZES, Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconBookmark } from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inherited from a Button",
	caption:
		"Size and colour are inherited, not passed. A `Button` publishes its own step on the shared scale and its variant's foreground token, so a bare `Icon` composed into it comes out right with nothing said at the call site — no `startIcon` prop, and no colour repeated here.",
	note: "`Badge`, `Switch.Content`, `Tabs.Trigger`, `Accordion.Trigger`, `Input.Group`'s decorators, `ListGroup.ItemPrefix` and `Screen.Navbar.BackButton` publish the same defaults, each carrying its own step on the shared scale and its own variant's foreground token.",
	capture: {},
};

const VARIANTS = ["primary", "secondary", "outline", "destructive"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_SIZES.map((size) => (
				<Button key={size} size={size} testID={`bookmark-${size}`}>
					<Icon icon={IconBookmark} />
					<Button.Label>size {size}</Button.Label>
				</Button>
			))}
			<View className="flex-row flex-wrap gap-2">
				{VARIANTS.map((variant) => (
					<Button key={variant} size="sm" variant={variant}>
						<Icon icon={IconBookmark} />
						<Button.Label>{variant}</Button.Label>
					</Button>
				))}
			</View>
		</View>
	);
}
