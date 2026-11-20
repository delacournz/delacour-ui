import { Button } from "@delacour/react-native-ui/button";
import { Screen } from "@delacour/react-native-ui/screen";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { TextInput, View } from "react-native";
import { KEYBOARD_HAS_ROUNDED_CORNERS, KeyboardToolbar } from "react-native-keyboard-controller";

const FIELDS = [
	"Full name",
	"Email",
	"Phone",
	"Company",
	"Street",
	"City",
	"Postcode",
	"Notes",
	"Referred by",
	"Anything else",
] as const;

/**
 * How far `KeyboardToolbar`'s top edge sits above the keyboard's: its height
 * (`KEYBOARD_TOOLBAR_HEIGHT`, 42) plus the 11pt it floats above a keyboard with
 * rounded corners (`OPENED_OFFSET`). keyboard-controller exports neither, so
 * both are named once here.
 */
const TOOLBAR_OFFSET = 42 + (KEYBOARD_HAS_ROUNDED_CORNERS ? 11 : 0);

/**
 * A form screen: `keyboardAware` scrolls the focused field clear of the
 * keyboard, the toolbar riding it, and the sticky footer on top of both.
 *
 * The last fields are the ones worth tapping — a plain scroll area would leave
 * them behind the keyboard, and one that only reserved keyboard height would
 * still leave them behind the footer riding on top of it.
 *
 * `KeyboardToolbar` adds previous / next / done above the keyboard, and the
 * footer's `keyboardOffset` is how far it stands above the keyboard: without it the Save button sits
 * behind the toolbar.
 */
export default function ScreenFormDemo(): ReactElement {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, string>>({});

	return (
		<Screen>
			<Screen.Navbar center={<Screen.Navbar.Title>Keyboard-aware form</Screen.Navbar.Title>} placement="static">
				<Screen.Navbar.BackButton glyph="close" onPress={() => router.back()} />
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-4" keyboardAware>
				<Text.Caption>
					Tap the last field. It should sit directly above the Save button, and the button above the toolbar.
				</Text.Caption>

				{FIELDS.map((field) => (
					<View className="gap-1.5" key={field}>
						<Text.Label>{field}</Text.Label>
						<TextInput
							className="h-button-md rounded-lg border border-border bg-card px-3 font-sans text-base text-foreground"
							onChangeText={(text) => setValues((current) => ({ ...current, [field]: text }))}
							placeholder={field}
							placeholderTextColorClassName="accent-muted-foreground"
							value={values[field] ?? ""}
						/>
					</View>
				))}
			</Screen.ScrollArea>

			<Screen.Footer keyboardOffset={TOOLBAR_OFFSET} sticky>
				<Button haptic="medium" onPress={() => router.back()}>
					Save
				</Button>
			</Screen.Footer>

			<KeyboardToolbar />
		</Screen>
	);
}
