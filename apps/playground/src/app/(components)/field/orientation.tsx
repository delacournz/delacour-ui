import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * The two orientations.
 *
 * There is no `responsive` third. shadcn's switches on a CSS container query,
 * which React Native does not have.
 *
 * The horizontal rows hold a real `Checkbox`, which makes the invalid section
 * below the live proof of the state cascade rather than a mock-up of it: nothing
 * on those boxes says `isInvalid`, and they redden from the `Field` alone.
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
					Label beside control, for something small enough to sit on one line. The box carries no label of its own — the
					field already named it, and a `Checkbox.Label` here would name it twice. Tap anywhere on the row, not just the
					box.
				</Text.Caption>
				<Field.Group>
					<Field orientation="horizontal">
						<Field.Label>Subscribe to the newsletter</Field.Label>
						<Checkbox color="primary" />
					</Field>
					<Field orientation="horizontal">
						<Field.Label>Show read receipts</Field.Label>
						<Checkbox color="primary" defaultChecked />
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
						<Checkbox color="primary" defaultChecked />
					</Field>
					<Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Delete after 30 days</Field.Label>
							<Field.Description>Applies to items in the archive only.</Field.Description>
						</Field.Content>
						<Checkbox color="primary" />
					</Field>
				</View>
			</Section>

			<Section title="Horizontal and invalid">
				<Text.Caption>
					The cascade works on either axis, and it reaches the control. The checkbox below names no state of its own —
					both it and the label turn danger from the `Field`.
				</Text.Caption>
				<Field isInvalid orientation="horizontal">
					<Field.Content>
						<Field.Label>Accept the terms</Field.Label>
						<Field.Error>You must accept the terms to continue.</Field.Error>
					</Field.Content>
					<Checkbox />
				</Field>
			</Section>

			<Section title="Horizontal and disabled">
				<Text.Caption>
					The same channel carries `isDisabled`, so the box blocks its own press and fades with the label naming it.
				</Text.Caption>
				<Field isDisabled orientation="horizontal">
					<Field.Label>Share anonymous usage data</Field.Label>
					<Checkbox color="primary" defaultChecked />
				</Field>
			</Section>
		</GalleryScreen>
	);
}
