import { Icon } from "@delacour/react-native-ui/icon";
import { IconUnlocked } from "@delacour/react-native-ui/icons/central";
import { SlideButton } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom handle",
	caption: "Children on `SlideButton.Thumb` replace the chevron. An `Icon` takes the handle's glyph size and colour.",
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<SlideButton isAutoReset isFullWidth size="lg" testID="custom-thumb">
			<SlideButton.Label>Slide to unlock</SlideButton.Label>
			<SlideButton.Thumb>
				<Icon icon={IconUnlocked} />
			</SlideButton.Thumb>
		</SlideButton>
	);
}
