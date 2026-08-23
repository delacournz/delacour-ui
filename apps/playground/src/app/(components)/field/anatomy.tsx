import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * The parts of a field, and the spacing ladder that holds them apart.
 *
 * The last section is the one worth staring at: a label attaches to the control
 * below it rather than the one above only because the gap inside a field is
 * tighter than the gap between two. Nothing else is doing that work.
 */
export default function FieldAnatomyDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle="The parts and the rhythm" title="Field anatomy">
			<Section title="Label and control">
				<Text.Caption>
					The minimum. `Field.Label` is `Text.Label` — it renders the preset, never its own scale.
				</Text.Caption>
				<Field>
					<Field.Label>Full name</Field.Label>
					<Input placeholder="Ada Lovelace" />
				</Field>
			</Section>

			<Section title="With a description">
				<Text.Caption>`Field.Description` is `Text.Caption`, and stays muted in every state.</Text.Caption>
				<Field>
					<Field.Label>Username</Field.Label>
					<Input autoCapitalize="none" placeholder="ada" />
					<Field.Description>This is how other people will find you.</Field.Description>
				</Field>
			</Section>

			<Section title="With an error">
				<Text.Caption>
					`Field.Error` renders nothing when it has no children, so `&lt;Field.Error&gt;{"{error}"}&lt;/Field.Error&gt;`
					disappears on its own once the value is fixed.
				</Text.Caption>
				<View className="gap-4">
					<Field isInvalid>
						<Field.Label>Email</Field.Label>
						<Input defaultValue="not-an-email" inputMode="email" />
						<Field.Error>Enter a valid email address.</Field.Error>
					</Field>
					<Field>
						<Field.Label>Email</Field.Label>
						<Input defaultValue="ada@example.com" inputMode="email" />
						<Field.Error>{undefined}</Field.Error>
					</Field>
				</View>
			</Section>

			<Section title="All four">
				<Field isInvalid>
					<Field.Label>Password</Field.Label>
					<Input defaultValue="hunter2" secureTextEntry />
					<Field.Description>At least twelve characters.</Field.Description>
					<Field.Error>That password is too short.</Field.Error>
				</Field>
			</Section>

			<Section title="The gap ladder">
				<Text.Caption>
					A field&apos;s own parts sit closer together than two fields do. Cover the labels and the two fields still
					read as two — that is the only thing keeping them apart.
				</Text.Caption>
				<Field.Group>
					<Field>
						<Field.Label>City</Field.Label>
						<Input placeholder="Wellington" />
						<Field.Description>Where the invoice is sent.</Field.Description>
					</Field>
					<Field>
						<Field.Label>Postcode</Field.Label>
						<Input inputMode="numeric" placeholder="6011" />
						<Field.Description>Four digits.</Field.Description>
					</Field>
				</Field.Group>
			</Section>
		</GalleryScreen>
	);
}
