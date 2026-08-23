import { CHECKBOX_ALIGNMENTS, CHECKBOX_COLORS, CHECKBOX_SIZES, Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const CHANNELS = [
	{ label: "Email", value: "email" },
	{ label: "SMS", value: "sms" },
	{ label: "Push notifications", value: "push" },
] as const;

const PERMISSIONS = ["Read", "Write", "Delete"] as const;

/**
 * One colour, ticked and not, side by side.
 *
 * Built from the exported `as const` array rather than written out, so a colour
 * added to `CHECKBOX_COLORS` appears here with no edit.
 */
function ColorRow({ color }: { color: (typeof CHECKBOX_COLORS)[number] }): ReactElement {
	const [isChecked, setChecked] = useState(true);

	return (
		<View className="flex-row items-center gap-4">
			<Checkbox color={color} isChecked={isChecked} onCheckedChange={setChecked}>
				<Checkbox.Label>{color}</Checkbox.Label>
			</Checkbox>
			<Checkbox color={color} defaultChecked={false} />
		</View>
	);
}

export default function CheckboxGallery(): ReactElement {
	const [channels, setChannels] = useState<string[]>(["email"]);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [feedbackCount, setFeedbackCount] = useState(0);

	const allPermissions = permissions.length === PERMISSIONS.length;
	const somePermissions = permissions.length > 0 && !allPermissions;

	const toggleAll = () => setPermissions(allPermissions ? [] : [...PERMISSIONS]);
	const bump = () => setFeedbackCount((count) => count + 1);

	return (
		<GalleryScreen subtitle={`${channels.length} channels · ${permissions.length} permissions`} title="Checkbox">
			<Section title="Colours">
				<Text.Caption>
					Ticked and unticked at every colour. An unticked box is chrome at all six — the colour only says what a tick
					means.
				</Text.Caption>
				<View className="gap-3">
					{CHECKBOX_COLORS.map((color) => (
						<ColorRow color={color} key={color} />
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<Text.Caption>The box, its glyph and the label step together. A bare box sits below each row.</Text.Caption>
				<View className="gap-3">
					{CHECKBOX_SIZES.map((size) => (
						<View className="flex-row items-center gap-4" key={size}>
							<Checkbox color="primary" defaultChecked size={size}>
								<Checkbox.Label>size {size}</Checkbox.Label>
							</Checkbox>
							<Checkbox color="primary" size={size} />
						</View>
					))}
				</View>
			</Section>

			<Section title="Alignment">
				<Text.Caption>
					In a fixed-width column, so the row fill is visible. `end` pushes the box to the far edge — the iOS Settings
					layout.
				</Text.Caption>
				<View className="w-64 gap-3 rounded-lg border border-border p-3">
					{CHECKBOX_ALIGNMENTS.map((alignment) => (
						<Checkbox alignment={alignment} color="primary" defaultChecked key={alignment}>
							<Checkbox.Label>alignment {alignment}</Checkbox.Label>
						</Checkbox>
					))}
				</View>
			</Section>

			<Section title="Indeterminate">
				<Text.Caption>
					The parent draws a dash while its children are partly selected, and reports `mixed` to a screen reader rather
					than a half-truth.
				</Text.Caption>
				<View className="gap-3">
					<Checkbox
						color="primary"
						isChecked={allPermissions}
						isIndeterminate={somePermissions}
						onCheckedChange={toggleAll}
					>
						<Checkbox.Label>Select all</Checkbox.Label>
					</Checkbox>
					<View className="pl-7">
						<Checkbox.Group checked={permissions} color="primary" onChecked={setPermissions}>
							{PERMISSIONS.map((permission) => (
								<Checkbox key={permission} value={permission}>
									{permission}
								</Checkbox>
							))}
						</Checkbox.Group>
					</View>
				</View>
			</Section>

			<Section title="Checkbox.Group">
				<Text.Caption>
					One array of the children's values. `onChecked` fires with the whole new list every time a box is toggled.
				</Text.Caption>
				<Checkbox.Group checked={channels} color="success" onChecked={setChannels}>
					{CHANNELS.map((channel) => (
						<Checkbox key={channel.value} value={channel.value}>
							<Checkbox.Label>{channel.label}</Checkbox.Label>
						</Checkbox>
					))}
				</Checkbox.Group>
				<Text.Code>{JSON.stringify(channels)}</Text.Code>
			</Section>

			<Section title="Group axes are defaults">
				<Text.Caption>
					The group sets `lg` and `info`; the middle box overrides the colour and keeps the size. That is the opposite
					of `Input.Group`, which owns the one box its field draws into.
				</Text.Caption>
				<Checkbox.Group color="info" defaultChecked={["a", "b", "c"]} size="lg">
					<Checkbox value="a">
						<Checkbox.Label>Inherits info</Checkbox.Label>
					</Checkbox>
					<Checkbox color="danger" value="b">
						<Checkbox.Label>Overrides to danger</Checkbox.Label>
					</Checkbox>
					<Checkbox value="c">
						<Checkbox.Label>Inherits info</Checkbox.Label>
					</Checkbox>
				</Checkbox.Group>
			</Section>

			<Section title="Invalid and disabled">
				<Text.Caption>
					Invalid outranks the colour, so a rejected value stays legible while it is being corrected. Disabled fades the
					whole row, label included.
				</Text.Caption>
				<View className="gap-3">
					<Checkbox color="success" defaultChecked isInvalid>
						<Checkbox.Label>Invalid beats success</Checkbox.Label>
					</Checkbox>
					<Checkbox isInvalid>
						<Checkbox.Label>Invalid and unticked</Checkbox.Label>
					</Checkbox>
					<Checkbox color="primary" defaultChecked isDisabled>
						<Checkbox.Label>Disabled and ticked</Checkbox.Label>
					</Checkbox>
					<Checkbox.Group defaultChecked={["x"]} isDisabled>
						<Checkbox value="x">
							<Checkbox.Label>Disabled by the group</Checkbox.Label>
						</Checkbox>
						<Checkbox isDisabled={false} value="y">
							<Checkbox.Label>Opted back out of it</Checkbox.Label>
						</Checkbox>
					</Checkbox.Group>
				</View>
			</Section>

			<Section title="Inside a Field">
				<Text.Caption>
					`Field.Label` names the control from a row away, so the box is bare — and the whole row is the target, so
					tapping the label or its description ticks the box. The invalid field reddens it with nothing said at the
					checkbox, and the third one opts out.
				</Text.Caption>
				<Field.Group>
					<Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Sync across devices</Field.Label>
							<Field.Description>Your drafts follow you to every device you sign in on.</Field.Description>
						</Field.Content>
						<Checkbox color="primary" defaultChecked />
					</Field>
					<Field isInvalid orientation="horizontal">
						<Field.Content>
							<Field.Label>Accept the terms</Field.Label>
							<Field.Error>You must accept the terms to continue.</Field.Error>
						</Field.Content>
						<Checkbox />
					</Field>
					<Field isInvalid orientation="horizontal">
						<Field.Label>Opted out of the invalid field</Field.Label>
						<Checkbox color="success" defaultChecked isInvalid={false} />
					</Field>
				</Field.Group>
			</Section>

			<Section title="Press feedback">
				<Text.Caption>
					The root is a `Pressable`, so its whole vocabulary comes through. Only two defaults differ from a bare one:
					`fade`, and a `selection` haptic.
				</Text.Caption>
				<View className="gap-3">
					<Checkbox color="primary" onCheckedChange={bump}>
						<Checkbox.Label>Default — fade, selection haptic</Checkbox.Label>
					</Checkbox>
					<Checkbox color="primary" haptic={false} onCheckedChange={bump}>
						<Checkbox.Label>haptic={"{false}"} — silent</Checkbox.Label>
					</Checkbox>
					<Checkbox color="primary" feedback="scale" haptic="heavy" onCheckedChange={bump}>
						<Checkbox.Label>feedback="scale", haptic="heavy"</Checkbox.Label>
					</Checkbox>
					<Text.Caption color="muted">{`Toggled ${feedbackCount} times`}</Text.Caption>
				</View>
			</Section>

			<Section title="Bare boxes and their targets">
				<Text.Caption>
					A checkbox with no label takes hit slop out toward the 44pt minimum. One with a label does not — the row is
					already the target, and slop on top of it would overlap the row below.
				</Text.Caption>
				<View className="flex-row items-center gap-6">
					{CHECKBOX_SIZES.map((size) => (
						<Checkbox color="primary" defaultChecked key={size} size={size} />
					))}
				</View>
			</Section>

			<Section title="Long label in a narrow column">
				<Text.Caption>The label wraps and the box holds its square rather than being squashed by it.</Text.Caption>
				<View className="w-48">
					<Checkbox color="warning" defaultChecked>
						<Checkbox.Label>A deliberately long checkbox label that has to wrap onto several lines</Checkbox.Label>
					</Checkbox>
				</View>
			</Section>
		</GalleryScreen>
	);
}
