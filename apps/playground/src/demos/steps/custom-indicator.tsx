import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconCheckmark1Small,
	IconCreditCard1,
	IconMapPin,
	IconPackage,
	IconPeople,
} from "@delacour/react-native-ui/icons/central";
import { Steps } from "@delacour/react-native-ui/steps";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom indicator",
	caption:
		"`Steps.Indicator` takes a render function of the step's state — here an icon per step, and a check once it is done. The `Icon` inherits the glyph size and colour.",
	capture: { align: "stretch" },
};

const STEPS: readonly { title: string; icon: IconComponent }[] = [
	{ title: "Contact", icon: IconPeople },
	{ title: "Address", icon: IconMapPin },
	{ title: "Payment", icon: IconCreditCard1 },
	{ title: "Parcel", icon: IconPackage },
];

export function Demo(): ReactElement {
	return (
		<Steps defaultValue={2} size="lg" variant="secondary">
			{STEPS.map((item, index) => (
				<Steps.Item key={item.title} step={index} testID={`steps-custom-${index}`}>
					<Steps.Indicator>
						{({ status }) => <Icon icon={status === "completed" ? IconCheckmark1Small : item.icon} />}
					</Steps.Indicator>
					<Steps.Title>{item.title}</Steps.Title>
				</Steps.Item>
			))}
		</Steps>
	);
}
