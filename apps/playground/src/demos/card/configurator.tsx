import { Button } from "@delacour/react-native-ui/button";
import {
	CARD_FOOTER_VARIANTS,
	CARD_SIZES,
	Card,
	type CardFooterVariant,
	type CardSize,
} from "@delacour/react-native-ui/card";
import { Radio } from "@delacour/react-native-ui/radio";
import { SURFACE_VARIANTS, type SurfaceVariant } from "@delacour/react-native-ui/surface";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Configurator",
	caption: "Every fill, size and footer, one pick at a time — and each optional part switched on and off.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const VARIANT_LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

const SIZE_LABELS: Record<CardSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

const FOOTER_LABELS: Record<CardFooterVariant, string> = {
	default: "Default",
	band: "Band",
};

function isVariant(value: string): value is SurfaceVariant {
	return (SURFACE_VARIANTS as readonly string[]).includes(value);
}

function isSize(value: string): value is CardSize {
	return (CARD_SIZES as readonly string[]).includes(value);
}

function isFooter(value: string): value is CardFooterVariant {
	return (CARD_FOOTER_VARIANTS as readonly string[]).includes(value);
}

/** One labelled switch in the part toggles. */
function PartToggle({
	label,
	isSelected,
	onChange,
	testID,
}: {
	label: string;
	isSelected: boolean;
	onChange: (value: boolean) => void;
	testID: string;
}): ReactElement {
	return (
		<View className="flex-row items-center justify-between gap-3">
			<Text.Label>{label}</Text.Label>
			<Switch
				accessibilityLabel={label}
				isSelected={isSelected}
				onSelectedChange={onChange}
				size="sm"
				testID={testID}
			/>
		</View>
	);
}

export function Demo(): ReactElement {
	const [variant, setVariant] = useState<SurfaceVariant>("default");
	const [size, setSize] = useState<CardSize>("md");
	const [footer, setFooter] = useState<CardFooterVariant>("default");
	const [hasDescription, setDescription] = useState(true);
	const [hasAction, setAction] = useState(true);
	const [hasFooter, setHasFooter] = useState(true);

	return (
		<View className="gap-5">
			<Card size={size} testID="card-configurator" variant={variant}>
				<Card.Header>
					<Card.Title>Storage</Card.Title>
					{hasDescription ? <Card.Description>18.4 GB of 50 GB used.</Card.Description> : null}
					{hasAction ? (
						<Card.Action>
							<Button size="sm" testID="card-configurator-action" variant="ghost">
								Manage
							</Button>
						</Card.Action>
					) : null}
				</Card.Header>
				<Card.Content>
					<Text.Caption testID="card-configurator-summary">
						{VARIANT_LABELS[variant]} · {SIZE_LABELS[size]} · {FOOTER_LABELS[footer]}
					</Text.Caption>
				</Card.Content>
				{hasFooter ? (
					<Card.Footer className="justify-end" variant={footer}>
						<Button size="sm" variant="outline">
							Upgrade
						</Button>
					</Card.Footer>
				) : null}
			</Card>
			<View className="gap-2">
				<Text.Overline>Variant</Text.Overline>
				<Radio.Group
					accessibilityLabel="Variant"
					onSelected={(value) => isVariant(value) && setVariant(value)}
					orientation="horizontal"
					selected={variant}
				>
					{SURFACE_VARIANTS.map((name) => (
						<Radio key={name} testID={`card-configurator-variant-${name}`} value={name}>
							{VARIANT_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Overline>Size</Text.Overline>
				<Radio.Group
					accessibilityLabel="Size"
					onSelected={(value) => isSize(value) && setSize(value)}
					orientation="horizontal"
					selected={size}
				>
					{CARD_SIZES.map((name) => (
						<Radio key={name} testID={`card-configurator-size-${name}`} value={name}>
							{SIZE_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Overline>Footer</Text.Overline>
				<Radio.Group
					accessibilityLabel="Footer"
					onSelected={(value) => isFooter(value) && setFooter(value)}
					orientation="horizontal"
					selected={footer}
				>
					{CARD_FOOTER_VARIANTS.map((name) => (
						<Radio key={name} testID={`card-configurator-footer-${name}`} value={name}>
							{FOOTER_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
			<View className="gap-3">
				<PartToggle
					isSelected={hasDescription}
					label="Description"
					onChange={setDescription}
					testID="card-configurator-description"
				/>
				<PartToggle isSelected={hasAction} label="Action" onChange={setAction} testID="card-configurator-has-action" />
				<PartToggle
					isSelected={hasFooter}
					label="Footer"
					onChange={setHasFooter}
					testID="card-configurator-has-footer"
				/>
			</View>
		</View>
	);
}
