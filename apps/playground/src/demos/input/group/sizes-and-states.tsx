import { Icon } from "delacour-react-native-ui/icon";
import { IconAt, IconMagnifyingGlass } from "delacour-react-native-ui/icons/central";
import { INPUT_SIZES, Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and states",
	caption:
		"The group owns the box, so `variant`, `size`, `isInvalid` and `isDisabled` live on it — one box, one set of axes. The decorators follow the invalid state with the border.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_SIZES.map((size) => (
				<Input.Group key={size} size={size}>
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					<Input placeholder={`Size ${size}`} />
					<Input.Group.Suffix>{size}</Input.Group.Suffix>
				</Input.Group>
			))}
			<Input.Group isInvalid>
				<Input.Group.Prefix>
					<Icon icon={IconAt} />
				</Input.Group.Prefix>
				<Input defaultValue="not-an-email" />
				<Input.Group.Suffix>required</Input.Group.Suffix>
			</Input.Group>
			<Input.Group isDisabled>
				<Input.Group.Prefix>
					<Icon icon={IconMagnifyingGlass} />
				</Input.Group.Prefix>
				<Input defaultValue="Unavailable" />
			</Input.Group>
			<Input.Group variant="secondary">
				<Input.Group.Prefix>
					<Icon icon={IconMagnifyingGlass} />
				</Input.Group.Prefix>
				<Input placeholder="Secondary" />
			</Input.Group>
		</View>
	);
}
