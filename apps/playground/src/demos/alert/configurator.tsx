import {
	ALERT_SIZES,
	ALERT_STATUSES,
	ALERT_VARIANTS,
	Alert,
	type AlertSize,
	type AlertStatus,
	type AlertVariant,
} from "@delacour/react-native-ui/alert";
import { Radio } from "@delacour/react-native-ui/radio";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Configurator",
	caption: "Every status, variant and size, one pick at a time, with and without the description.",
};

const STATUS_LABELS: Record<AlertStatus, string> = {
	default: "Default",
	info: "Info",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
};

const VARIANT_LABELS: Record<AlertVariant, string> = {
	soft: "Soft",
	surface: "Surface",
};

const SIZE_LABELS: Record<AlertSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

function isStatus(value: string): value is AlertStatus {
	return (ALERT_STATUSES as readonly string[]).includes(value);
}

function isVariant(value: string): value is AlertVariant {
	return (ALERT_VARIANTS as readonly string[]).includes(value);
}

function isSize(value: string): value is AlertSize {
	return (ALERT_SIZES as readonly string[]).includes(value);
}

export function Demo(): ReactElement {
	const [status, setStatus] = useState<AlertStatus>("info");
	const [variant, setVariant] = useState<AlertVariant>("soft");
	const [size, setSize] = useState<AlertSize>("md");
	const [hasDescription, setHasDescription] = useState(true);

	return (
		<View className="gap-6">
			<Alert size={size} status={status} testID="configurator-alert" variant={variant}>
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title testID="configurator-title">
						{STATUS_LABELS[status]} · {VARIANT_LABELS[variant]} · {SIZE_LABELS[size]}
					</Alert.Title>
					{hasDescription ? (
						<Alert.Description>
							A description wraps under the title, and the glyph stays level with its first line.
						</Alert.Description>
					) : null}
				</Alert.Content>
			</Alert>
			<View className="flex-row items-center justify-between">
				<Text.Label>Description</Text.Label>
				<Switch
					accessibilityLabel="Description"
					isSelected={hasDescription}
					onSelectedChange={setHasDescription}
					testID="configurator-description"
				/>
			</View>
			<View className="gap-2">
				<Text.Overline>Status</Text.Overline>
				<Radio.Group
					accessibilityLabel="Status"
					onSelected={(value) => isStatus(value) && setStatus(value)}
					orientation="horizontal"
					selected={status}
				>
					{ALERT_STATUSES.map((name) => (
						<Radio key={name} testID={`configurator-status-${name}`} value={name}>
							{STATUS_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Overline>Variant</Text.Overline>
				<Radio.Group
					accessibilityLabel="Variant"
					onSelected={(value) => isVariant(value) && setVariant(value)}
					orientation="horizontal"
					selected={variant}
				>
					{ALERT_VARIANTS.map((name) => (
						<Radio key={name} testID={`configurator-variant-${name}`} value={name}>
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
					{ALERT_SIZES.map((name) => (
						<Radio key={name} testID={`configurator-size-${name}`} value={name}>
							{SIZE_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
		</View>
	);
}
