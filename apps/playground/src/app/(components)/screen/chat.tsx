import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowUp, IconBug } from "@delacour/native-ui/icons/central";
import { SCREEN_CHAT_INPUT_NATIVE_ID, Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { TextInput, View } from "react-native";

type Message = { id: string; body: string; mine: boolean };

const SEED: Message[] = Array.from({ length: 30 }, (_, index) => ({
	body:
		index % 3 === 0
			? `A longer message, number ${index + 1}, that wraps onto more than one line.`
			: `Message ${index + 1}`,
	id: String(index),
	mine: index % 2 === 1,
}));

/** The collapsed height of the composer below, so the list's FIRST layout already clears it. */
const COMPOSER_BASE_HEIGHT = 44;

function Bubble({ message }: { message: Message }): ReactElement {
	return (
		<View className={`py-1 ${message.mine ? "items-end" : "items-start"}`}>
			<View className={`max-w-[80%] rounded-2xl px-3 py-2 ${message.mine ? "bg-primary" : "bg-secondary"}`}>
				<Text className={message.mine ? "text-primary-foreground" : "text-secondary-foreground"}>{message.body}</Text>
			</View>
		</View>
	);
}

/**
 * A conversation: the composer rides the keyboard and the newest message stays
 * clear of it.
 *
 * `composerBaseHeight` seeds the clearance so the list's first layout is
 * already correct. Without it the list scrolls to the end against a reserve
 * that is a commit or two out of date, and the newest message lands under the
 * composer — intermittently, which is the worst kind of wrong.
 *
 * Turn the debug overlay on and send a message: the green occupancy band's top
 * edge must sit flush on the footer's red one.
 */
export default function ScreenChatDemo(): ReactElement {
	const router = useRouter();
	const [messages, setMessages] = useState(SEED);
	const [draft, setDraft] = useState("");
	const [debug, setDebug] = useState(false);

	function send(): void {
		if (!draft.trim()) return;
		setMessages((current) => [...current, { body: draft.trim(), id: `sent-${current.length}`, mine: true }]);
		setDraft("");
	}

	return (
		<Screen debug={debug}>
			<Screen.Navbar
				actions={
					<Button
						accessibilityLabel="Toggle layout debugging"
						onPress={() => setDebug((current) => !current)}
						size="icon-sm"
						variant={debug ? "primary" : "secondary"}
					>
						<Icon icon={IconBug} />
					</Button>
				}
				placement="static"
			>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Chat list</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.Content textInputNativeID={SCREEN_CHAT_INPUT_NATIVE_ID}>
				<Screen.ChatList
					className="flex-1"
					composerBaseHeight={COMPOSER_BASE_HEIGHT}
					data={messages}
					estimatedItemSize={56}
					keyExtractor={(message: Message) => message.id}
					renderItem={({ item }: { item: Message }) => <Bubble message={item} />}
				/>
			</Screen.Content>

			<Screen.Footer sticky>
				<View className="flex-row items-end gap-2">
					<TextInput
						className="h-button-md flex-1 rounded-full border border-border bg-card px-4 text-base text-foreground"
						multiline
						nativeID={SCREEN_CHAT_INPUT_NATIVE_ID}
						onChangeText={setDraft}
						placeholder="Message"
						placeholderTextColor="#9CA3AF"
						value={draft}
					/>
					<Button accessibilityLabel="Send" haptic="medium" onPress={send} size="icon-md">
						<Icon icon={IconArrowUp} />
					</Button>
				</View>
			</Screen.Footer>
		</Screen>
	);
}
