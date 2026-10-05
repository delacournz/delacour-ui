import { Icon } from "@delacour/react-native-ui/icon";
import { IconArrowUp, IconAt, IconImages1, IconPaperclip1 } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { Text } from "@delacour/react-native-ui/text";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Composer",
	caption:
		"A `Textarea` takes the field's place and `Input.Group.Block` stacks a toolbar above and a footer below it — one box, one border, one focus ring.",
	keyboardAware: true,
};

const LIMIT = 280;

export function Demo(): ReactElement {
	const [message, setMessage] = useState("");

	return (
		<Input.Group>
			<Input.Group.Block position="start">
				<Input.Group.Button accessibilityLabel="Attach a file" testID="composer-attach">
					<Icon icon={IconPaperclip1} />
				</Input.Group.Button>
				<Input.Group.Button accessibilityLabel="Add an image">
					<Icon icon={IconImages1} />
				</Input.Group.Button>
				<Input.Group.Separator />
				<Input.Group.Button accessibilityLabel="Mention someone">
					<Icon icon={IconAt} />
				</Input.Group.Button>
			</Input.Group.Block>
			<Input.Group.Separator />
			<Textarea
				autoGrow
				maxLength={LIMIT}
				maxRows={6}
				onChangeText={setMessage}
				placeholder="Write a message"
				rows={2}
				testID="composer-field"
				value={message}
			/>
			<Input.Group.Block className="justify-between" position="end">
				<Text.Caption className="tabular-nums">{`${message.length}/${LIMIT}`}</Text.Caption>
				<Input.Group.Button
					accessibilityLabel="Send"
					onPress={() => setMessage("")}
					testID="composer-send"
					variant="secondary"
				>
					<Icon icon={IconArrowUp} />
				</Input.Group.Button>
			</Input.Group.Block>
		</Input.Group>
	);
}
