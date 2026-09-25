import { Icon } from "@delacour/react-native-ui/icon";
import { IconChevronRight, IconCreditCard1, IconLock, IconReceiptBill } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Spinner } from "@delacour/react-native-ui/spinner";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "States",
	caption:
		"`isDisabled` dims the row and blocks presses; `busy` blocks them while work is in flight; no `onPress` renders a static row.",
};

export function Demo(): ReactElement {
	const [isSyncing, setIsSyncing] = useState(false);

	useEffect(() => {
		if (!isSyncing) return;
		const timeout = setTimeout(() => setIsSyncing(false), 1500);
		return () => clearTimeout(timeout);
	}, [isSyncing]);

	return (
		<Item.Group>
			<Item busy={isSyncing} onPress={() => setIsSyncing(true)} testID="item-busy" variant="outline">
				<Item.Media variant="icon">
					<Icon icon={IconReceiptBill} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Sync invoices</Item.Title>
					<Item.Description>{isSyncing ? "Syncing…" : "Tap to sync"}</Item.Description>
				</Item.Content>
				<Item.Actions>{isSyncing ? <Spinner size="sm" /> : <Icon icon={IconChevronRight} />}</Item.Actions>
			</Item>
			<Item isDisabled onPress={() => {}} testID="item-disabled" variant="outline">
				<Item.Media variant="icon">
					<Icon icon={IconLock} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Security</Item.Title>
					<Item.Description>Locked by your organisation</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Icon icon={IconChevronRight} />
				</Item.Actions>
			</Item>
			<Item testID="item-static" variant="outline">
				<Item.Media variant="icon">
					<Icon icon={IconCreditCard1} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Visa ending 4242</Item.Title>
					<Item.Description>Static — no press handler, not a button</Item.Description>
				</Item.Content>
			</Item>
		</Item.Group>
	);
}
