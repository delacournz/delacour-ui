import { Button } from "delacour-react-native-ui/button";
import { Field } from "delacour-react-native-ui/field";
import { Icon } from "delacour-react-native-ui/icon";
import { IconAt, IconCurrencyDollar } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import { Screen } from "delacour-react-native-ui/screen";
import { type ReactElement, useState } from "react";
import { Keyboard } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a form",
	note: "Tap the last field. It should sit directly above the Save button, not behind it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("ada");

	const isEmailInvalid = email.length > 0 && !email.includes("@");
	const isUsernameTaken = username.trim().toLowerCase() === "ada";

	return (
		<Screen>
			<Screen.Navbar center={<Screen.Navbar.Title>In a form</Screen.Navbar.Title>} placement="static" />

			<Screen.ScrollArea contentContainerClassName="gap-8" keyboardAware>
				<Field.Set>
					<Field.Legend>Profile</Field.Legend>
					<Field.Description>This appears on invoices and emails.</Field.Description>
					<Field.Group>
						<Field>
							<Field.Label>Full name</Field.Label>
							<Input placeholder="Ada Lovelace" textContentType="name" />
						</Field>

						<Field isInvalid={isUsernameTaken}>
							<Field.Label>Username</Field.Label>
							<Input autoCapitalize="none" onChangeText={setUsername} testID="username" value={username} />
							<Field.Description>Letters and numbers only.</Field.Description>
							<Field.Error>{isUsernameTaken ? "Choose another username." : undefined}</Field.Error>
						</Field>

						<Field isInvalid={isEmailInvalid}>
							<Field.Label>Email</Field.Label>
							<Input.Group>
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
							<Field.Error>{isEmailInvalid ? "Enter a valid email address." : undefined}</Field.Error>
						</Field>
					</Field.Group>
				</Field.Set>

				<Field.Separator>Optional</Field.Separator>

				<Field.Set>
					<Field.Legend>Billing</Field.Legend>
					<Field.Group>
						<Field>
							<Field.Label>Company</Field.Label>
							<Input placeholder="Analytical Engines Ltd" />
						</Field>

						<Field>
							<Field.Label>Monthly budget</Field.Label>
							<Input.Group>
								<Input.Group.Prefix>
									<Icon icon={IconCurrencyDollar} />
								</Input.Group.Prefix>
								<Input inputMode="decimal" placeholder="0.00" />
								<Input.Group.Suffix>NZD</Input.Group.Suffix>
							</Input.Group>
							<Field.Description>We only use this to suggest a plan.</Field.Description>
						</Field>

						<Field isDisabled>
							<Field.Label>Account ID</Field.Label>
							<Input defaultValue="acct_8813" />
							<Field.Description>Assigned when the account was created.</Field.Description>
						</Field>

						<Field>
							<Field.Label>Notes</Field.Label>
							<Input multiline placeholder="Anything else we should know" size="lg" testID="notes" />
						</Field>
					</Field.Group>
				</Field.Set>
			</Screen.ScrollArea>

			<Screen.Footer sticky>
				<Button haptic="medium" onPress={() => Keyboard.dismiss()} testID="save">
					Save
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
