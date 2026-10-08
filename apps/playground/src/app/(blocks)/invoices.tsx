import { Badge, type BadgeColor } from "@delacour/react-native-ui/badge";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconReceiptBill } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Kpi } from "@delacour/react-native-ui/kpi";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Tabs } from "@delacour/react-native-ui/tabs";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import {
	filterInvoices,
	formatMoney,
	INVOICE_FILTER_LABELS,
	INVOICE_FILTERS,
	INVOICES,
	type InvoiceFilter,
	type InvoiceStatus,
	outstandingTotal,
} from "@/blocks/invoices";
import { BlockScreen } from "@/components/block-screen";
import { BlockSection } from "@/components/block-section";

const STATUS_COLOR: Record<InvoiceStatus, BadgeColor> = {
	paid: "success",
	unpaid: "warning",
	overdue: "destructive",
	draft: "default",
};

/**
 * Invoices: an outstanding total over a status filter and the invoices in a tray.
 *
 * The total is a `Kpi` with no trend; each row is an `Item` whose amount is set
 * in the actions with the etched status badge under it. Dates and numbers are
 * the fixture's strings, and money goes through `formatMoney`.
 */
export default function InvoicesBlock(): ReactElement {
	const [filter, setFilter] = useState<InvoiceFilter>("all");
	const invoices = filterInvoices(INVOICES, filter);

	return (
		<BlockScreen subtitle="Block" title="Invoices">
			<Kpi material="etched">
				<Kpi.Header>
					<Kpi.Title>Outstanding</Kpi.Title>
				</Kpi.Header>
				<Kpi.Content>
					<Kpi.Stat>
						<Kpi.Value>{formatMoney(outstandingTotal(INVOICES))}</Kpi.Value>
					</Kpi.Stat>
				</Kpi.Content>
				<Kpi.Footer variant="band">Unpaid and overdue, across all customers</Kpi.Footer>
			</Kpi>

			<Tabs onValueChange={(value) => setFilter(value as InvoiceFilter)} size="sm" value={filter} variant="primary">
				<Tabs.List>
					<Tabs.ScrollView>
						<Tabs.Indicator />
						{INVOICE_FILTERS.map((entry) => (
							<Tabs.Trigger key={entry} testID={`invoices-${entry}`} value={entry}>
								{INVOICE_FILTER_LABELS[entry]}
							</Tabs.Trigger>
						))}
					</Tabs.ScrollView>
				</Tabs.List>
			</Tabs>

			{invoices.length > 0 ? (
				<BlockSection kicker={`${invoices.length} invoices`}>
					<ListGroup className="rounded-xl">
						{invoices.map((invoice) => (
							<Item key={invoice.id} testID={`invoice-${invoice.id}`}>
								<Item.Content>
									<Item.Title numberOfLines={1}>{invoice.customer}</Item.Title>
									<Item.Description>{`${invoice.number} · ${invoice.issued}`}</Item.Description>
								</Item.Content>
								<Item.Actions>
									<View className="items-end gap-1">
										<Text.Label>{formatMoney(invoice.amountCents)}</Text.Label>
										<Badge color={STATUS_COLOR[invoice.status]} material="etched" size="sm" variant="soft">
											{INVOICE_FILTER_LABELS[invoice.status]}
										</Badge>
									</View>
								</Item.Actions>
							</Item>
						))}
					</ListGroup>
				</BlockSection>
			) : (
				<EmptyState testID="invoices-empty" variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconReceiptBill} />
						</EmptyState.Media>
						<EmptyState.Title>No invoices</EmptyState.Title>
						<EmptyState.Description>
							Nothing is marked {INVOICE_FILTER_LABELS[filter].toLowerCase()}.
						</EmptyState.Description>
					</EmptyState.Header>
				</EmptyState>
			)}
		</BlockScreen>
	);
}
