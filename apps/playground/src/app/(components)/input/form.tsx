import { Button } from "@delacour/native-ui/button";
import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconAt, IconCurrencyDollar, IconMagnifyingGlass } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";

/**
 * `Input` in the composition it exists for: a real form under a sticky footer.
 *
 * The library ships no `Input.Label` or `Input.ErrorMessage` — `Text.Label` and
 * `Text.Caption` already are those, and a second definition of a label is one
 * that can drift from the type scale. This screen is what that trade looks like
 * at a call site.
 *
 * The keyboard handling is `Screen`'s, not this component's: `keyboardAware`
 * scrolls the focused field clear of both the keyboard and the footer riding on
 * it. The last fields are the ones worth tapping.
 */
export default function InputFormDemo(): ReactElement {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [notes, setNotes] = useState("");

	const isEmailInvalid = email.length > 0 && !email.includes("@");

	return (
		<Screen>
			<Screen.Navbar center={<Screen.Navbar.Title>In a form</Screen.Navbar.Title>} placement="static">
				<Screen.Navbar.BackButton glyph="close" onPress={() => router.back()} />
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-4" keyboardAware>
				<Text.Caption>
					Tap the last field. It should sit directly above the Save button, not behind it. Nothing on this screen names
					a keyboard height or a safe-area inset.
				</Text.Caption>

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
							textContentType="emailAddress"
							value={email}
						/>
					</Input.Group>
					{isEmailInvalid ? (
						<Text.Caption color="danger">That does not look like an email address.</Text.Caption>
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
					<Input multiline onChangeText={setNotes} placeholder="Anything else" size="lg" value={notes} />
				</Field>
			</Screen.ScrollArea>

			<Screen.Footer sticky>
				<Button haptic="medium" onPress={() => router.back()}>
					Save
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
