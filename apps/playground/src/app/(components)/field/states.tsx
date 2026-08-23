import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconAt } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * The state cascade — the reason `Field` has a context at all.
 *
 * On the web shadcn reddens a field's control with
 * `group-data-[invalid=true]/field:`, a parent-scoped selector. Uniwind matches
 * data selectors against the props of the component carrying the class, so no
 * class on a `Field` can reach the `Input` inside it. A context can, and this
 * screen is the check that it does.
 */
export default function FieldStatesDemo(): ReactElement {
	const [email, setEmail] = useState("not-an-email");
	const isInvalid = !email.includes("@");

	return (
		<GalleryScreen keyboardAware subtitle="The cascade" title="Field states">
			<Section title="One flag, three things">
				<Text.Caption>
					The `Input` below names no props at all. The label turns danger, the control turns danger, and the description
					stays muted so the error is the one line that appeared.
				</Text.Caption>
				<Field isInvalid>
					<Field.Label>Username</Field.Label>
					<Input defaultValue="ada" />
					<Field.Description>This is how other people will find you.</Field.Description>
					<Field.Error>That username is taken.</Field.Error>
				</Field>
			</Section>

			<Section title="A control can opt out">
				<Text.Caption>
					Nearest wins. Both fields sit in an invalid `Field`; the second names `isInvalid={false}` on the `Input` and
					stays calm while its label still reports the problem.
				</Text.Caption>
				<View className="gap-4">
					<Field isInvalid>
						<Field.Label>Inherits</Field.Label>
						<Input defaultValue="Turns danger" />
					</Field>
					<Field isInvalid>
						<Field.Label>Opts out</Field.Label>
						<Input defaultValue="Stays calm" isInvalid={false} />
					</Field>
				</View>
			</Section>

			<Section title="Through an Input.Group">
				<Text.Caption>
					The group reads the field too, so a decorated field turns danger the same way — border, prefix icon, caret and
					affix together.
				</Text.Caption>
				<Field isInvalid>
					<Field.Label>Email</Field.Label>
					<Input.Group>
						<Input.Group.Prefix>
							<Icon icon={IconAt} />
						</Input.Group.Prefix>
						<Input defaultValue="not-an-email" />
						<Input.Group.Suffix>required</Input.Group.Suffix>
					</Input.Group>
					<Field.Error>Enter a valid email address.</Field.Error>
				</Field>
			</Section>

			<Section title="Live">
				<Text.Caption>Type an `@`. Everything leaves danger together, and the error removes itself.</Text.Caption>
				<Field isInvalid={isInvalid}>
					<Field.Label>Email</Field.Label>
					<Input autoCapitalize="none" inputMode="email" onChangeText={setEmail} value={email} />
					<Field.Description>We use this for receipts.</Field.Description>
					<Field.Error>{isInvalid ? "Enter a valid email address." : undefined}</Field.Error>
				</Field>
			</Section>

			<Section title="Disabled">
				<Text.Caption>
					The label fades and the control blocks editing. The description does not fade — dimmed copy on top of a dimmed
					control reads as two problems rather than one state.
				</Text.Caption>
				<Field isDisabled>
					<Field.Label>Account ID</Field.Label>
					<Input defaultValue="acct_8813" />
					<Field.Description>Assigned when the account was created.</Field.Description>
				</Field>
			</Section>
		</GalleryScreen>
	);
}
