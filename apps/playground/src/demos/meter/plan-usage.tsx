import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCloud, IconCode, IconPeople } from "@delacour/react-native-ui/icons/central";
import { Meter } from "@delacour/react-native-ui/meter";
import { Text } from "@delacour/react-native-ui/text";
import { type ComponentProps, type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Plan usage",
	note: "A composed billing card. Every quota is judged the same way — optimum at zero, warning past 80%, destructive past 95% — so the eye finds the one about to run out. Simulate a day of use to push them over, and the readout says how much is left as well as painting it.",
	capture: { align: "stretch" },
};

type Quota = {
	id: string;
	label: string;
	icon: ComponentProps<typeof Icon>["icon"];
	used: number;
	limit: number;
	perDay: number;
	unit: Intl.NumberFormatOptions;
};

const INITIAL: readonly Quota[] = [
	{
		icon: IconCode,
		id: "requests",
		label: "API requests",
		limit: 100_000,
		perDay: 9_000,
		unit: { maximumFractionDigits: 0, notation: "compact" },
		used: 61_200,
	},
	{
		icon: IconCloud,
		id: "storage",
		label: "Storage",
		limit: 50,
		perDay: 3.5,
		unit: { maximumFractionDigits: 1, style: "unit", unit: "gigabyte" },
		used: 38.4,
	},
	{ icon: IconPeople, id: "seats", label: "Seats", limit: 10, perDay: 1, unit: { maximumFractionDigits: 0 }, used: 8 },
];

function QuotaRow({ quota }: { quota: Quota }): ReactElement {
	const format = new Intl.NumberFormat(undefined, quota.unit);
	const left = Math.max(0, quota.limit - quota.used);

	return (
		<View className="flex-row items-center gap-3 px-4 py-3">
			<Icon icon={quota.icon} />
			<Meter
				className="flex-1"
				formatOptions={quota.unit}
				high={quota.limit * 0.95}
				low={quota.limit * 0.8}
				maxValue={quota.limit}
				optimum={0}
				size="sm"
				testID={`meter-quota-${quota.id}`}
				value={quota.used}
				valueLabel={left === 0 ? "Limit reached" : `${format.format(left)} left`}
			>
				<Meter.Header>
					<Meter.Label>{quota.label}</Meter.Label>
					<Meter.Output testID={`meter-quota-${quota.id}-output`} />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
		</View>
	);
}

export function Demo(): ReactElement {
	const [quotas, setQuotas] = useState(INITIAL);
	const [day, setDay] = useState(24);

	const simulate = (): void => {
		setDay((current) => current + 1);
		setQuotas((current) => current.map((quota) => ({ ...quota, used: quota.used + quota.perDay })));
	};

	const reset = (): void => {
		setDay(24);
		setQuotas(INITIAL);
	};

	return (
		<View className="gap-3">
			<View className="overflow-hidden rounded-lg border border-border bg-card">
				<View className="flex-row items-baseline justify-between px-4 pt-4 pb-1">
					<Text.Subheader>Team plan</Text.Subheader>
					<Text.Caption color="muted" testID="meter-quota-day">
						Day {day} of 30
					</Text.Caption>
				</View>
				{quotas.map((quota, index) => (
					<View className={index > 0 ? "border-border border-t" : undefined} key={quota.id}>
						<QuotaRow quota={quota} />
					</View>
				))}
			</View>
			<View className="flex-row gap-2">
				<Button className="flex-1" onPress={simulate} size="sm" testID="meter-quota-simulate" variant="secondary">
					<Button.Label>Simulate a day</Button.Label>
				</Button>
				<Button className="flex-1" onPress={reset} size="sm" testID="meter-quota-reset" variant="ghost">
					<Button.Label>Reset</Button.Label>
				</Button>
			</View>
		</View>
	);
}
