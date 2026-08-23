import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconCheckmark1Small } from "@delacour/native-ui/icons/central";
import { RADIO_SIZES, RADIO_VARIANTS, Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const PLANS = ["free", "pro", "team"] as const;

const SCROLL_CHECK = ["one", "two", "three", "four", "five", "six", "seven", "eight"] as const;

export default function RadioGallery(): ReactElement {
	const [plan, setPlan] = useState<string>();
	const [fieldPlan, setFieldPlan] = useState<string>();
	const [speed, setSpeed] = useState("standard");
	const [row, setRow] = useState("standard");
	const [scrolled, setScrolled] = useState("one");

	return (
		<GalleryScreen subtitle={plan ? `Plan: ${plan}` : "No plan selected"} title="Radio">
			<Section title="Variants and states">
				<View className="gap-4">
					{RADIO_VARIANTS.map((variant) => (
						<View className="gap-2" key={variant}>
							<Text.Caption color="muted">{variant}</Text.Caption>
							<Radio.Group
								accessibilityLabel={`${variant} example`}
								defaultSelected="on"
								orientation="horizontal"
								variant={variant}
							>
								<Radio value="on">Selected</Radio>
								<Radio value="off">Not selected</Radio>
							</Radio.Group>
						</View>
					))}
				</View>
				<Text.Caption color="muted">
					The ring is drawn from Views, not an icon — so the dot springs in on the UI thread and every colour stays a
					class the variant tests can reach.
				</Text.Caption>
			</Section>

			<Section title="Sizes">
				<View className="gap-4">
					{RADIO_SIZES.map((size) => (
						<View className="gap-2" key={size}>
							<Text.Caption color="muted">{size}</Text.Caption>
							<Radio.Group accessibilityLabel={`Size ${size}`} defaultSelected="a" orientation="horizontal" size={size}>
								<Radio value="a">First</Radio>
								<Radio value="b">Second</Radio>
							</Radio.Group>
						</View>
					))}
				</View>
				<Text.Caption color="muted">
					The ring indexes the same --spacing-icon-* scale Icon and Spinner share, and the label names a Text size step
					rather than restating a type scale.
				</Text.Caption>
			</Section>

			<Section title="Controlled">
				<Radio.Group accessibilityLabel="Plan" onSelected={setPlan} selected={plan ?? null}>
					{PLANS.map((name) => (
						<Radio key={name} value={name}>
							{name}
						</Radio>
					))}
				</Radio.Group>
				<Text.Caption color="muted">
					`selected` takes `plan ?? null`. Passing a bare `undefined` would read as uncontrolled, so the group would
					hold its own state and then switch modes on the first press.
				</Text.Caption>
			</Section>

			<Section title="Uncontrolled">
				<Radio.Group accessibilityLabel="Shipping speed, uncontrolled" defaultSelected="standard">
					<Radio value="standard">Standard</Radio>
					<Radio value="express">Express</Radio>
				</Radio.Group>
				<Text.Caption color="muted">
					No state at the call site. This is the first exercise useControllableState has had in the package.
				</Text.Caption>
			</Section>

			<Section title="Horizontal, wrapping">
				<Radio.Group
					accessibilityLabel="Scroll check"
					onSelected={setScrolled}
					orientation="horizontal"
					selected={scrolled}
				>
					{SCROLL_CHECK.map((name) => (
						<Radio key={name} value={name}>
							{name}
						</Radio>
					))}
				</Radio.Group>
			</Section>

			<Section title="Per-option description">
				<Radio.Group accessibilityLabel="Delivery" onSelected={setSpeed} selected={speed}>
					<Radio value="standard">
						<View className="min-w-0 shrink gap-0.5">
							<Radio.Label>Standard</Radio.Label>
							<Text.Caption>Arrives in three to five days.</Text.Caption>
						</View>
					</Radio>
					<Radio value="express">
						<View className="min-w-0 shrink gap-0.5">
							<Radio.Label>Express</Radio.Label>
							<Text.Caption>Arrives tomorrow.</Text.Caption>
						</View>
					</Radio>
				</Radio.Group>
				<Text.Caption color="muted">
					There is no Radio.Description. The caption is composed inside the row, so it stays within the one tap target
					and inside the accessible name.
				</Text.Caption>
			</Section>

			<Section title="Inside a Field">
				<Field isInvalid={fieldPlan === undefined}>
					<Field.Label>Plan</Field.Label>
					<Radio.Group accessibilityLabel="Plan" onSelected={setFieldPlan} selected={fieldPlan ?? null}>
						<Radio value="free">Free</Radio>
						<Radio value="pro">Pro</Radio>
					</Radio.Group>
					<Field.Error>{fieldPlan === undefined ? "Pick a plan to continue." : ""}</Field.Error>
				</Field>
				<Text.Caption color="muted">
					The group names no state of its own — the rings turn danger from the Field's context, and go quiet the moment
					a plan is picked.
				</Text.Caption>
			</Section>

			<Section title="Trailing indicator, as a settings row">
				<Radio.Group accessibilityLabel="Delivery speed" onSelected={setRow} selected={row}>
					<Radio value="standard">
						<View className="min-w-0 shrink gap-0.5">
							<Radio.Label>Standard delivery</Radio.Label>
							<Text.Caption>Arrives in three to five days.</Text.Caption>
						</View>
						<Radio.Indicator />
					</Radio>
					<Radio value="express">
						<View className="min-w-0 shrink gap-0.5">
							<Radio.Label>Express delivery</Radio.Label>
							<Text.Caption>Arrives tomorrow.</Text.Caption>
						</View>
						<Radio.Indicator />
					</Radio>
				</Radio.Group>
				<Text.Caption color="muted">
					The text sits inside the radio, so the whole row is one tap target — tapping the description selects the
					option. Writing the indicator last is all it takes; the row spreads on its own, with no flex-1 spacer.
				</Text.Caption>
			</Section>

			<Section title="Disabled, and the state ladder">
				<View className="gap-5">
					<View className="gap-2">
						<Text.Caption color="muted">A disabled group</Text.Caption>
						<Radio.Group accessibilityLabel="Disabled group" defaultSelected="a" isDisabled>
							<Radio value="a">First</Radio>
							<Radio value="b">Second</Radio>
						</Radio.Group>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">One disabled option</Text.Caption>
						<Radio.Group accessibilityLabel="One disabled option" defaultSelected="a">
							<Radio value="a">Available</Radio>
							<Radio isDisabled value="b">
								Unavailable in your area
							</Radio>
						</Radio.Group>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">Opting out of a disabled Field</Text.Caption>
						<Field isDisabled>
							<Field.Label>Everything here is disabled</Field.Label>
							<Radio.Group accessibilityLabel="Field opt-out">
								<Radio value="a">Disabled by the field</Radio>
								<Radio isDisabled={false} value="b">
									Opted back in
								</Radio>
							</Radio.Group>
						</Field>
					</View>
				</View>
				<Text.Caption color="muted">
					Nearest wins: a group, then the radio's own prop, then the Field. A group that names nothing still lets one
					option disable itself; a group that disables everything cannot be escaped.
				</Text.Caption>
			</Section>

			<Section title="Custom indicator">
				<Radio.Group accessibilityLabel="Custom indicator" defaultSelected="a">
					<Radio value="a">
						<Radio.Indicator className="border-success">
							{({ isSelected }) => (
								<Icon color={isSelected ? "success" : "muted-foreground"} icon={IconCheckmark1Small} />
							)}
						</Radio.Indicator>
						<Radio.Label>Children replace the dot</Radio.Label>
					</Radio>
					<Radio value="b">
						<Radio.Label>Trailing ring</Radio.Label>
						<Radio.Indicator />
					</Radio>
				</Radio.Group>
				<Text.Caption color="muted">
					Writing the indicator out by hand suppresses the automatic one, which is what puts a ring at the end of the
					row.
				</Text.Caption>
			</Section>

			<Section title="Long label in a narrow column">
				<View className="w-48">
					<Radio.Group accessibilityLabel="Long label" defaultSelected="a">
						<Radio value="a">A deliberately long option label that has to wrap onto several lines</Radio>
						<Radio value="b">Short</Radio>
					</Radio.Group>
				</View>
				<Text.Caption color="muted">
					The ring never squashes and the label wraps — shrink rather than flex-1, which would collapse to nothing in a
					horizontal group.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}
