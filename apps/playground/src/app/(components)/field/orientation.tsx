import { Button } from "@delacour/native-ui/button";
import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconFormSquare, IconSquareCheck } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * A stand-in for the `Checkbox` this package does not have yet.
 *
 * A horizontal field exists for a control that sits beside its label rather than
 * under it, and every such control here is still unbuilt. This is a `Button`
 * wearing a check glyph — enough to judge the layout, and deliberately not a
 * component anyone should reach for.
 */
function CheckboxStandIn({ label }: { label: string }): ReactElement {
	const [isChecked, setChecked] = useState(false);

	return (
		<Button
			accessibilityLabel={label}
			isIconOnly
			onPress={() => setChecked((current) => !current)}
			size="sm"
			variant={isChecked ? "primary" : "outline"}
		>
			<Icon icon={isChecked ? IconSquareCheck : IconFormSquare} />
		</Button>
	);
}

/**
 * The two orientations.
 *
 * There is no `responsive` third. shadcn's switches on a CSS container query,
 * which React Native does not have.
 */
export default function FieldOrientationDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle="Vertical and horizontal" title="Field orientation">
			<Section title="Vertical">
				<Text.Caption>The default. Label over control, which is what a text field almost always wants.</Text.Caption>
				<Field>
					<Field.Label>Display name</Field.Label>
					<Input placeholder="Ada" />
				</Field>
			</Section>

			<Section title="Horizontal">
				<Text.Caption>
					Label beside control, for something small enough to sit on one line. The controls below stand in for the
					`Checkbox` and `Switch` this package has yet to build.
				</Text.Caption>
				<Field.Group>
					<Field orientation="horizontal">
						<Field.Label>Subscribe to the newsletter</Field.Label>
						<CheckboxStandIn label="Subscribe to the newsletter" />
					</Field>
					<Field orientation="horizontal">
						<Field.Label>Show read receipts</Field.Label>
						<CheckboxStandIn label="Show read receipts" />
					</Field>
				</Field.Group>
			</Section>

			<Section title="Horizontal, with a description">
				<Text.Caption>
					`Field.Content` bundles the label and its description into one block, so the row lays out as text-then-control
					rather than three things in a line. Without it the description would become a third column.
				</Text.Caption>
				<View className="gap-4">
					<Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Sync across devices</Field.Label>
							<Field.Description>Your drafts follow you to every device you sign in on.</Field.Description>
						</Field.Content>
						<CheckboxStandIn label="Sync across devices" />
					</Field>
					<Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Delete after 30 days</Field.Label>
							<Field.Description>Applies to items in the archive only.</Field.Description>
						</Field.Content>
						<CheckboxStandIn label="Delete after 30 days" />
					</Field>
				</View>
			</Section>

			<Section title="Horizontal and invalid">
				<Text.Caption>The cascade works on either axis.</Text.Caption>
				<Field isInvalid orientation="horizontal">
					<Field.Content>
						<Field.Label>Accept the terms</Field.Label>
						<Field.Error>You must accept the terms to continue.</Field.Error>
					</Field.Content>
					<CheckboxStandIn label="Accept the terms" />
				</Field>
			</Section>
		</GalleryScreen>
	);
}
