import { AVATAR_SIZES, Avatar } from "@delacour/react-native-ui/avatar";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "A size is a fixed edge — 32, 40, 48 and 64 points — so faces line up in a stack and beside list rows.",
	capture: {},
};

/** One person per size, so the photo and the initials are both seen at every step. */
const PEOPLE: Record<(typeof AVATAR_SIZES)[number], { name: string; photo?: string }> = {
	sm: { name: "Ana Silva" },
	md: { name: "Ben Okafor", photo: "https://i.pravatar.cc/160?img=12" },
	lg: { name: "Chen Wei" },
	xl: { name: "Dana Kim", photo: "https://i.pravatar.cc/160?img=32" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-end gap-3">
			{AVATAR_SIZES.map((size) => {
				const person = PEOPLE[size];
				return (
					<Avatar
						key={size}
						name={person.name}
						size={size}
						source={person.photo ? { uri: person.photo } : undefined}
						testID={`avatar-${size}`}
					/>
				);
			})}
		</View>
	);
}
