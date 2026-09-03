import { Accordion } from "delacour-react-native-ui/accordion";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption:
		"The whole accordion, or one row inside an enabled one. `isDisabled={false}` opts a row back out of a disabled accordion — an explicit false is a value rather than an absence.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Accordion isDisabled>
				<Accordion.Item value="one">
					<Accordion.Trigger testID="inert">Every row is inert</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>Nothing here opens.</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item isDisabled={false} value="two">
					<Accordion.Trigger testID="opted-back-in">Except this one</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>It opted itself back in.</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
			<Accordion>
				<Accordion.Item value="one">
					<Accordion.Trigger testID="enabled">An enabled row</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>Open as usual.</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item isDisabled value="two">
					<Accordion.Trigger testID="disabled">A disabled one beside it</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>Unreachable.</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
		</View>
	);
}
