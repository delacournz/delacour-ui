import { Icon } from "@delacour/react-native-ui/icon";
import { IconArchive, IconEmail1, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import { type ReactElement, useState } from "react";
import { ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inbox mode",
	caption:
		"The list is for reading until a long press: that enters the mode with the pressed message picked. Taps then toggle, the header counts and offers the way out, and the bar acts on what is picked.",
	note: "Delete and Archive leave the mode once they have run. The list pads its bottom so the last row scrolls clear of the bar.",
	capture: { align: "stretch", flow: "selection-mode/inbox-mode", hero: true },
};

type Message = { id: string; from: string; subject: string; isRead: boolean };

const MESSAGES: readonly Message[] = [
	{ id: "m1", from: "Aria Whitlock", subject: "Launch checklist, final pass", isRead: false },
	{ id: "m2", from: "Billing", subject: "Your September invoice is ready", isRead: false },
	{ id: "m3", from: "Rawiri Kemp", subject: "Re: row padding in the settings list", isRead: true },
	{ id: "m4", from: "Mihi Paewai", subject: "Photos from Saturday", isRead: true },
	{ id: "m5", from: "Design review", subject: "Notes from Thursday's crit", isRead: false },
	{ id: "m6", from: "Lena Varga", subject: "Can we move standup?", isRead: true },
];

export function Demo(): ReactElement {
	const [messages, setMessages] = useState<readonly Message[]>(MESSAGES);

	const remove = (ids: string[]) => setMessages((list) => list.filter((message) => !ids.includes(message.id)));
	const markRead = (ids: string[]) =>
		setMessages((list) => list.map((message) => (ids.includes(message.id) ? { ...message, isRead: true } : message)));

	return (
		<View className="h-[520px]">
			<SelectionMode haptic="selection" values={messages.map((message) => message.id)}>
				<SelectionMode.Header closeTestID="inbox-close" title="Inbox" />
				<ScrollView contentContainerClassName="pb-24">
					<SelectionMode.Group>
						{messages.map((message) => (
							<SelectionMode.Item key={message.id} testID={`message-${message.id}`} value={message.id}>
								<Item>
									<Item.Media variant="icon">
										<Icon color={message.isRead ? "muted-foreground" : "primary"} icon={IconEmail1} />
									</Item.Media>
									<Item.Content>
										<Item.Title className={message.isRead ? "font-normal" : "font-semibold"} numberOfLines={1}>
											{message.from}
										</Item.Title>
										<Item.Description numberOfLines={1}>{message.subject}</Item.Description>
									</Item.Content>
								</Item>
							</SelectionMode.Item>
						))}
					</SelectionMode.Group>
				</ScrollView>
				<SelectionMode.Bar>
					<SelectionMode.Action icon={IconEmail1} onPress={markRead}>
						Mark read
					</SelectionMode.Action>
					<SelectionMode.Action icon={IconArchive} isExitOnPress onPress={remove}>
						Archive
					</SelectionMode.Action>
					<SelectionMode.Action icon={IconTrashCan} isDestructive isExitOnPress onPress={remove}>
						Delete
					</SelectionMode.Action>
				</SelectionMode.Bar>
			</SelectionMode>
		</View>
	);
}
