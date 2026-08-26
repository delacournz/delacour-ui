import { Icon, IconDefaultsProvider } from "@delacour/native-ui/icon";
import { IconBell, IconHeart, IconStar, IconUser } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A subtree of defaults",
	caption:
		"`IconDefaultsProvider` is the mechanism underneath every one of those components: it supplies the class and the token an unstyled `Icon` in its subtree adopts, and `useIconDefaults()` reads the nearest one — `null` outside a provider. The top row is the bare fallback, 20pt on `foreground`; the bottom row inherits 32pt on `primary`.",
	note: "The last two in the bottom row name their own `color` and `size`, and both still win. `iconVariants` carries no `defaultVariants` on purpose: a default would emit from inside that same call, ahead of the inherited class in the merge, and would then beat the enclosing component.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="flex-row items-center gap-4">
				<Icon icon={IconHeart} />
				<Icon icon={IconStar} />
				<Icon icon={IconBell} />
				<Icon icon={IconUser} />
			</View>
			<IconDefaultsProvider value={{ className: "size-icon-2xl", color: "primary" }}>
				<View className="flex-row items-center gap-4">
					<Icon icon={IconHeart} />
					<Icon icon={IconStar} />
					<Icon color="danger" icon={IconBell} />
					<Icon icon={IconUser} size="xs" />
				</View>
			</IconDefaultsProvider>
		</View>
	);
}
