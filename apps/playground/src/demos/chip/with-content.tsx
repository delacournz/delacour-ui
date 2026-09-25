import { Chip, useChip } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPeople } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Start and end content",
	caption:
		"An `Icon` needs no wrapper. An avatar or a count goes in `Chip.StartContent` or `Chip.EndContent`, and `useChip()` lets it restyle itself when the chip is selected.",
	capture: { align: "center" },
};

const PEOPLE = [
	{ initials: "AM", name: "Aroha" },
	{ initials: "JT", name: "James" },
	{ initials: "SK", name: "Sione" },
] as const;

/** Initials in a circle — the avatar a people picker would show. */
function Avatar({ initials }: { initials: string }): ReactElement {
	return (
		<Chip.StartContent className="-ml-1.5 size-6 rounded-full bg-primary">
			<Text className="font-semibold text-[10px] text-primary-foreground">{initials}</Text>
		</Chip.StartContent>
	);
}

/** A count that inverts with its chip, so it stays legible on the selected fill. */
function Count({ value }: { value: number }): ReactElement {
	const { isSelected } = useChip();
	return (
		<Chip.EndContent className={isSelected ? "rounded-full bg-background px-1.5" : "rounded-full bg-foreground px-1.5"}>
			<Text className={isSelected ? "font-semibold text-foreground text-xs" : "font-semibold text-background text-xs"}>
				{value}
			</Text>
		</Chip.EndContent>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="items-start gap-3">
			<View className="flex-row flex-wrap gap-2">
				{PEOPLE.map((person) => (
					<Chip
						defaultSelected={person.initials === "JT"}
						key={person.initials}
						testID={`person-${person.initials}`}
						variant="outline"
					>
						<Avatar initials={person.initials} />
						<Chip.Label>{person.name}</Chip.Label>
					</Chip>
				))}
			</View>
			<Chip defaultSelected={false} testID="count-chip">
				<Icon icon={IconPeople} />
				<Chip.Label>Assigned to me</Chip.Label>
				<Count value={12} />
			</Chip>
		</View>
	);
}
