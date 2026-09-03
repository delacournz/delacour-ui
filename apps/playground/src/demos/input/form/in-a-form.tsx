import { Button } from "delacour-react-native-ui/button";
import { Field } from "delacour-react-native-ui/field";
import { Icon } from "delacour-react-native-ui/icon";
import { IconAt, IconCurrencyDollar, IconMagnifyingGlass } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { Keyboard } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a form",
	caption:
		"Tap the last field. It should sit directly above the Save button, not behind it. Nothing on this screen names a keyboard height or a safe-area inset.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("");
	const [notes, setNotes] = useState("");

	const isEmailInvalid = email.length > 0 && !email.includes("@");

	return (
		<Screen>
			<Screen.Navbar center={<Screen.Navbar.Title>In a form</Screen.Navbar.Title>} placement="static" />

			<Screen.ScrollArea contentContainerClassName="gap-4" keyboardAware>
				<Field>
					<Field.Label>Full name</Field.Label>
					<Input placeholder="Ada Lovelace" textContentType="name" />
				</Field>

				<Field>
					<Field.Label>Email</Field.Label>
					<Input.Group isInvalid={isEmailInvalid}>
						<Input.Group.Prefix>
							<Icon icon={IconAt} />
						</Input.Group.Prefix>
						<Input
							autoCapitalize="none"
							inputMode="email"
							onChangeText={setEmail}
							placeholder="you@example.com"
							testID="email"
							textContentType="emailAddress"
							value={email}
						/>
					</Input.Group>
					{isEmailInvalid ? (
						<Text.Caption color="destructive">That does not look like an email address.</Text.Caption>
					) : null}
				</Field>

				<Field>
					<Field.Label>Company</Field.Label>
					<Input placeholder="Optional" />
				</Field>

				<Field>
					<Field.Label>Website</Field.Label>
					<Input.Group>
						<Input.Group.Prefix>https://</Input.Group.Prefix>
						<Input autoCapitalize="none" inputMode="url" placeholder="example" />
						<Input.Group.Suffix>.com</Input.Group.Suffix>
					</Input.Group>
				</Field>

				<Field>
					<Field.Label>Budget</Field.Label>
					<Input.Group>
						<Input.Group.Prefix>
							<Icon icon={IconCurrencyDollar} />
						</Input.Group.Prefix>
						<Input inputMode="decimal" placeholder="0.00" />
						<Input.Group.Suffix>NZD</Input.Group.Suffix>
					</Input.Group>
				</Field>

				<Field>
					<Field.Label>Referred by</Field.Label>
					<Input.Group>
						<Input.Group.Prefix>
							<Icon icon={IconMagnifyingGlass} />
						</Input.Group.Prefix>
						<Input placeholder="Search people" />
					</Input.Group>
				</Field>

				<Field>
					<Field.Label>Street</Field.Label>
					<Input placeholder="12 Cuba Street" textContentType="streetAddressLine1" />
				</Field>

				<Field>
					<Field.Label>City</Field.Label>
					<Input placeholder="Wellington" textContentType="addressCity" />
				</Field>

				<Field>
					<Field.Label>Postcode</Field.Label>
					<Input inputMode="numeric" placeholder="6011" textContentType="postalCode" />
				</Field>

				<Field>
					<Field.Label>Notes</Field.Label>
					<Input multiline onChangeText={setNotes} placeholder="Anything else" size="lg" testID="notes" value={notes} />
				</Field>
			</Screen.ScrollArea>

			<Screen.Footer sticky>
				<Button haptic="medium" onPress={() => Keyboard.dismiss()} testID="save">
					Save
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
