import { Button } from "@delacour/native-ui/button";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { TextInput, View } from "react-native";

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
 * A form screen: `keyboardAware` scrolls the focused field clear of both the
 * keyboard and the sticky footer.
 *
 * The last fields are the ones worth tapping — a plain scroll area would leave
 * them behind the keyboard, and one that only reserved keyboard height would
 * still leave them behind the footer riding on top of it.
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
				<Text.Caption>Tap the last field. It should sit directly above the Save button, not behind it.</Text.Caption>

				{FIELDS.map((field) => (
					<View className="gap-1.5" key={field}>
						<Text.Label>{field}</Text.Label>
						<TextInput
							className="h-button-md rounded-lg border border-border bg-card px-3 text-base text-foreground"
							onChangeText={(text) => setValues((current) => ({ ...current, [field]: text }))}
							placeholder={field}
							placeholderTextColor="#9CA3AF"
							value={values[field] ?? ""}
						/>
					</View>
				))}
			</Screen.ScrollArea>

			<Screen.Footer sticky>
				<Button haptic="medium" onPress={() => router.back()}>
					Save
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
