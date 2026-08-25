import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconBell, IconCheckmark1Small, IconMoon, IconSun, IconX } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { SWITCH_COLORS, SWITCH_SIZES, Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const SETTINGS = [
	{ key: "wifi", title: "Wi-Fi", description: "Join known networks automatically" },
	{ key: "bluetooth", title: "Bluetooth", description: "Discoverable while this screen is open" },
	{ key: "airdrop", title: "AirDrop", description: "Receive from everyone for ten minutes" },
] as const;

/**
 * One colour, on and off, side by side.
 *
 * Built from the exported `as const` array rather than written out, so a colour
 * added to `SWITCH_COLORS` appears here with no edit.
 */
function ColorRow({ color }: { color: (typeof SWITCH_COLORS)[number] }): ReactElement {
	const [isSelected, setSelected] = useState(true);

	return (
		<View className="flex-row items-center gap-4">
			<Switch color={color} isSelected={isSelected} onSelectedChange={setSelected} />
			<Switch color={color} defaultSelected={false} />
			<Text.Caption>{color}</Text.Caption>
		</View>
	);
}

export default function SwitchGallery(): ReactElement {
	const [dark, setDark] = useState(false);
	const [rejected, setRejected] = useState(false);
	const [rejectedAttempts, setRejectedAttempts] = useState(0);
	const [settings, setSettings] = useState<Record<string, boolean>>({ wifi: true });
	const [alerts, setAlerts] = useState(true);
	const [terms, setTerms] = useState(false);

	const enabled = Object.values(settings).filter(Boolean).length;

	return (
		<GalleryScreen subtitle={`${enabled} of ${SETTINGS.length} settings on`} title="Switch">
			<Section title="Tap or drag">
				<Text.Caption>
					One `Gesture.Pan()` drives both. A tap toggles; a drag takes the thumb with your finger and a release settles
					by position, or by a flick's velocity if you let go fast. Drag one half way and back — it commits nothing.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					{SWITCH_SIZES.map((size) => (
						<Switch color="primary" defaultSelected key={size} size={size} />
					))}
				</View>
			</Section>

			<Section title="Colours">
				<Text.Caption>
					On and off at every colour. An off switch is the same chrome at all six — the colour only says what being on
					means. Both the track and the knob fade between two token values off the thumb's own travel.
				</Text.Caption>
				<View className="gap-3">
					{SWITCH_COLORS.map((color) => (
						<ColorRow color={color} key={color} />
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<Text.Caption>
					The thumb reads the shared icon scale and everything else follows: the track is the thumb plus twice the
					inset, and one thumb longer than it is tall — so the thumb always travels exactly its own width.
				</Text.Caption>
				<View className="gap-3">
					{SWITCH_SIZES.map((size) => (
						<View className="flex-row items-center gap-4" key={size}>
							<Switch color="success" defaultSelected size={size} />
							<Switch color="success" size={size} />
							<Text.Caption>size {size}</Text.Caption>
						</View>
					))}
				</View>
			</Section>

			<Section title="Start and end content">
				<Text.Caption>
					Both are written once with no conditionals. `StartContent` is revealed as the switch turns on and `EndContent`
					as it turns off, each fading with the thumb's travel — so the knob reads as uncovering the other end. The
					glyphs take their step and colour from the switch.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					{SWITCH_SIZES.map((size) => (
						<Switch color="primary" defaultSelected key={size} size={size}>
							<Switch.StartContent>
								<Icon icon={IconCheckmark1Small} />
							</Switch.StartContent>
							<Switch.EndContent>
								<Icon icon={IconX} />
							</Switch.EndContent>
						</Switch>
					))}
				</View>
			</Section>

			<Section title="Text at the ends">
				<Text.Caption>
					A bare string is wrapped in a `Text` that inherits the layer's own treatment, so `ON` and `OFF` need nothing
					said at the call site.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					<Switch color="success" defaultSelected size="lg">
						<Switch.StartContent>ON</Switch.StartContent>
						<Switch.EndContent>OFF</Switch.EndContent>
					</Switch>
					<Switch color="danger" size="lg">
						<Switch.StartContent>ON</Switch.StartContent>
						<Switch.EndContent>OFF</Switch.EndContent>
					</Switch>
				</View>
			</Section>

			<Section title="A glyph in the knob">
				<Text.Caption>
					`Switch.Thumb` is composed in when the children hold none, so write it out only to fill or restyle it. It is
					drawn last however the children were ordered.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					<Switch color="info" isSelected={dark} onSelectedChange={setDark} size="lg">
						<Switch.Thumb>
							<Icon icon={dark ? IconMoon : IconSun} />
						</Switch.Thumb>
					</Switch>
					<Text.Caption>{dark ? "Dark" : "Light"}</Text.Caption>
				</View>
			</Section>

			<Section title="Controlled, and rejected">
				<Text.Caption>
					This one reports every change and never accepts one. Drag it across and let go: the thumb springs back to the
					state the parent actually holds rather than staying where your finger left it.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					<Switch
						color="warning"
						isSelected={rejected}
						onSelectedChange={() => setRejectedAttempts((count) => count + 1)}
					/>
					<Text.Caption>{rejectedAttempts} attempts, still off</Text.Caption>
				</View>
				<Text.Caption>
					The one below accepts them, from the same props — the only difference is what the parent does with the call.
				</Text.Caption>
				<Switch color="warning" isSelected={rejected} onSelectedChange={setRejected} />
			</Section>

			<Section title="Disabled and invalid">
				<Text.Caption>
					Disabled blocks the gesture and fades the whole control. Invalid returns danger at both ends, on the track and
					on the knob, so there is nothing to fade — the colour is the signal before the switch is on as much as after.
				</Text.Caption>
				<View className="flex-row items-center gap-4">
					<Switch color="primary" defaultSelected isDisabled />
					<Switch color="primary" isDisabled />
					<Switch defaultSelected isInvalid />
					<Switch isInvalid />
				</View>
			</Section>

			<Section title="Inside a Field">
				<Text.Caption>
					The switch hands its toggle back up, so tapping the label or the description beside it flips the switch. That
					is what lets a form switch be a bare {"`<Switch />`"} with the field naming it.
				</Text.Caption>
				<Field.Group>
					<Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Push notifications</Field.Label>
							<Field.Description>Tap this sentence — the row drives the switch.</Field.Description>
						</Field.Content>
						<Switch color="success" isSelected={alerts} onSelectedChange={setAlerts} />
					</Field>

					<Field isDisabled orientation="horizontal">
						<Field.Label>Sync over cellular</Field.Label>
						<Switch color="success" />
					</Field>

					<Field isInvalid={!terms} orientation="horizontal">
						<Field.Content>
							<Field.Label>Accept the terms</Field.Label>
							<Field.Error>{terms ? undefined : "Required before you can continue."}</Field.Error>
						</Field.Content>
						<Switch isSelected={terms} onSelectedChange={setTerms} />
					</Field>
				</Field.Group>
			</Section>

			<Section title="In a settings list">
				<Text.Caption>
					The row is a `ListGroup.Item` with the switch in its suffix. The row's own press is separate from the
					switch's, so a tap on the pill toggles and a tap on the row does not.
				</Text.Caption>
				<ListGroup>
					{SETTINGS.map((setting) => (
						<ListGroup.Item key={setting.key}>
							<ListGroup.ItemPrefix>
								<Icon icon={IconBell} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{setting.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{setting.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								<Switch
									accessibilityLabel={setting.title}
									color="success"
									isSelected={settings[setting.key] ?? false}
									onSelectedChange={(next) => setSettings((current) => ({ ...current, [setting.key]: next }))}
									size="sm"
								/>
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
					))}
				</ListGroup>
			</Section>

			<Section title="Without a label">
				<Text.Caption>
					A switch with no text near it needs an `accessibilityLabel`, the same rule an icon-only `Button` follows.
				</Text.Caption>
				<Switch accessibilityLabel="Aeroplane mode" color="primary" defaultSelected />
			</Section>
		</GalleryScreen>
	);
}
