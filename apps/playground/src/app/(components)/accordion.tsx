import { ACCORDION_SIZES, ACCORDION_VARIANTS, Accordion } from "@delacour/native-ui/accordion";
import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMinusSmall, IconPlusSmall, IconTruck } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const FAQ = [
	{
		key: "shipping",
		title: "Shipping",
		description: "2–5 business days",
		body: "Tracked from the moment it leaves us, and signed for on anything over $200. Rural addresses add a day.",
	},
	{
		key: "returns",
		title: "Returns",
		description: "30 days, no questions",
		body: "Send it back in any condition within thirty days. We pay the return postage and refund to the original card.",
	},
	{
		key: "warranty",
		title: "Warranty",
		description: "Two years",
		body: "Covers manufacturing faults for two years from delivery. Wear, water and the dog are not manufacturing faults.",
	},
] as const;

export default function AccordionGallery(): ReactElement {
	const [open, setOpen] = useState<string[]>(["returns"]);
	const [rejectedAttempts, setRejectedAttempts] = useState(0);
	const [note, setNote] = useState("");

	return (
		<GalleryScreen keyboardAware subtitle={`${open.length} of ${FAQ.length} open`} title="Accordion">
			<Section title="One at a time">
				<Text.Caption>
					The default. Opening a row closes the one that was open, and tapping the open one closes it — a panel's height
					is measured, then sprung from zero to whatever its content came out at.
				</Text.Caption>
				<Accordion defaultValue="shipping">
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>
								<Accordion.Title>{entry.title}</Accordion.Title>
								<Accordion.Description>{entry.description}</Accordion.Description>
							</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
			</Section>

			<Section title="Any number at once">
				<Text.Caption>
					`selectionMode="multiple"` reports a `string[]` instead of a `string | null`. This one is controlled, so the
					subtitle above counts what is open.
				</Text.Caption>
				<Accordion onValueChange={setOpen} selectionMode="multiple" value={open}>
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>{entry.title}</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
				<Button onPress={() => setOpen(FAQ.map((entry) => entry.key))} size="sm" variant="secondary">
					Open every one
				</Button>
			</Section>

			<Section title="Always one open">
				<Text.Caption>
					`isCollapsible={false}` bounds the *set*, never a single row. In multiple mode a row still closes while
					another is open — only the last one is refused, so the accordion can never empty and can never fill up and
					stick.
				</Text.Caption>
				<Accordion defaultValue={["shipping", "returns"]} isCollapsible={false} selectionMode="multiple">
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>{entry.title}</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
			</Section>

			<Section title="Variants">
				<Text.Caption>
					`ListGroup`'s set, because an accordion is the same kind of thing and the two sit beside each other on a
					screen. The variant paints the root alone — a trigger and a panel look the same in all four.
				</Text.Caption>
				<View className="gap-3">
					{ACCORDION_VARIANTS.map((variant) => (
						<Accordion key={variant} variant={variant}>
							<Accordion.Item value="one">
								<Accordion.Trigger>
									<Accordion.Title>{variant}</Accordion.Title>
								</Accordion.Trigger>
								<Accordion.Content>
									<Text.Paragraph>The surface is the root's. Everything inside it is unchanged.</Text.Paragraph>
								</Accordion.Content>
							</Accordion.Item>
							<Accordion.Item value="two">
								<Accordion.Trigger>Second row</Accordion.Trigger>
								<Accordion.Content>
									<Text.Paragraph>So the divider between them is visible too.</Text.Paragraph>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion>
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<Text.Caption>
					One axis drives the row metrics, both type scales, the chevron's step, the panel's padding and the divider
					inset — so a panel's text starts on the same margin as the title above it at every size.
				</Text.Caption>
				<View className="gap-3">
					{ACCORDION_SIZES.map((size) => (
						<Accordion defaultValue="one" key={size} size={size}>
							<Accordion.Item value="one">
								<Accordion.Trigger>
									<Accordion.Title>size {size}</Accordion.Title>
									<Accordion.Description>Title, description and chevron all step with it</Accordion.Description>
								</Accordion.Trigger>
								<Accordion.Content>
									<Text.Paragraph>The panel is inset to the trigger's own padding.</Text.Paragraph>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion>
					))}
				</View>
			</Section>

			<Section title="A glyph beside the title">
				<Text.Caption>
					A trigger assembles its own row: titles and descriptions stack in a column, anything else stays where it was
					written, and the indicator is moved to the end. An `Icon` needs nothing said at the call site — it inherits
					the accordion's glyph step and foreground.
				</Text.Caption>
				<Accordion>
					<Accordion.Item value="one">
						<Accordion.Trigger>
							<Icon icon={IconTruck} />
							<Accordion.Title>Delivery</Accordion.Title>
							<Accordion.Description>Written before the title, and it stays there</Accordion.Description>
						</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>{FAQ[0].body}</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</Section>

			<Section title="A custom indicator">
				<Text.Caption>
					Anything composed into an indicator rotates off the item's own travel, exactly like the default chevron.
					`isAnimated={false}` opts a *swapping* glyph out — a plus becoming a minus reads as broken when it also spins.
					The children can be a function, handed the row's state, so a swapping glyph needs no component of its own.
				</Text.Caption>
				<Accordion>
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>
								<Accordion.Title>{entry.title}</Accordion.Title>
								<Accordion.Indicator isAnimated={false}>
									{({ isExpanded }) => <Icon icon={isExpanded ? IconMinusSmall : IconPlusSmall} />}
								</Accordion.Indicator>
							</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
			</Section>

			<Section title="A panel keeps what is inside it">
				<Text.Caption>
					Type something, collapse the row, and open it again — the text is still there. A panel mounts on first expand
					and stays mounted, so a form keeps what was typed and a list keeps where it was scrolled. Nothing renders at
					all until a row is opened for the first time.
				</Text.Caption>
				<Accordion>
					<Accordion.Item value="note">
						<Accordion.Trigger>
							<Accordion.Title>Delivery note</Accordion.Title>
							<Accordion.Description>
								{note ? `${note.length} characters kept` : "Nothing typed yet"}
							</Accordion.Description>
						</Accordion.Trigger>
						<Accordion.Content>
							<Input onChangeText={setNote} placeholder="Leave it by the side gate" value={note} />
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item value="gift">
						<Accordion.Trigger>Gift options</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>This one has never been opened, so its panel has never been rendered.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</Section>

			<Section title="Controlled, and rejected">
				<Text.Caption>
					This one reports every tap and accepts none. The panel never opens and the chevron never turns, because both
					read the state the parent actually holds rather than the tap that asked for it.
				</Text.Caption>
				<Accordion onValueChange={() => setRejectedAttempts((count) => count + 1)} value={null}>
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>{entry.title}</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
				<Text.Caption>{rejectedAttempts} attempts, still shut</Text.Caption>
			</Section>

			<Section title="Disabled">
				<Text.Caption>
					The whole accordion, or one row inside an enabled one. `isDisabled={false}` opts a row back out of a disabled
					accordion — an explicit false is a value rather than an absence.
				</Text.Caption>
				<Accordion isDisabled>
					<Accordion.Item value="one">
						<Accordion.Trigger>Every row is inert</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>Nothing here opens.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item isDisabled={false} value="two">
						<Accordion.Trigger>Except this one</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>It opted itself back in.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
				<Accordion>
					<Accordion.Item value="one">
						<Accordion.Trigger>An enabled row</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>Open as usual.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item isDisabled value="two">
						<Accordion.Trigger>A disabled one beside it</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>Unreachable.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</Section>

			<Section title="Without dividers">
				<Text.Caption>
					Dividers are inserted between adjacent rows rather than written out, inset to the triggers' own padding. A
					`Separator` placed by hand suppresses the automatic one on either side; `isDivided={false}` turns them off.
				</Text.Caption>
				<Accordion isDivided={false} variant="secondary">
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>{entry.title}</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
			</Section>

			<Section title="Nothing has to opt in">
				<Text.Caption>
					Open a row and watch the block below. It slides with the panel because a real height is changing, not because
					it was told to — the animation lives on the accordion's own node. A layout transition would instead need
					painting onto every sibling on the screen to look like this.
				</Text.Caption>
				<View className="rounded-2xl bg-secondary p-4">
					<Text.Label>Above</Text.Label>
				</View>
				<Accordion variant="tertiary">
					{FAQ.map((entry) => (
						<Accordion.Item key={entry.key} value={entry.key}>
							<Accordion.Trigger>{entry.title}</Accordion.Trigger>
							<Accordion.Content>
								<Text.Paragraph>{entry.body}</Text.Paragraph>
							</Accordion.Content>
						</Accordion.Item>
					))}
				</Accordion>
				<View className="rounded-2xl bg-secondary p-4">
					<Text.Label>Below</Text.Label>
				</View>
			</Section>
		</GalleryScreen>
	);
}
