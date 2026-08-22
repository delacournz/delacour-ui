import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconChevronLeft } from "@delacour/native-ui/icons/central";
import { useRouter } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type GalleryScreenProps = {
	title: string;
	subtitle?: string;
	children: ReactNode;
};

/**
 * The frame every component gallery sits in: safe-area padding, a back row and
 * a scrolling body.
 *
 * Deliberately a ScrollView rather than a static screen: it exercises the
 * tap-versus-scroll gesture conflict, which is the thing most likely to break in
 * a component built on the Gesture API.
 *
 * The back control is a `Button` rather than a native stack header — the root
 * layout runs with `headerShown: false`, and a React Navigation header would
 * need its colours themed separately from the Uniwind token set.
 */
export function GalleryScreen({ title, subtitle, children }: GalleryScreenProps): ReactElement {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	return (
		<ScrollView
			className="flex-1 bg-background"
			contentContainerClassName="gap-8 p-5"
			contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top + 16 }}
		>
			<View className="flex-row items-center gap-3">
				<Button accessibilityLabel="Back" haptic="light" isIconOnly onPress={() => router.back()} variant="secondary">
					<Icon icon={IconChevronLeft} />
				</Button>
				<View className="flex-1 gap-0.5">
					<Text className="font-bold text-2xl text-foreground">{title}</Text>
					{subtitle ? <Text className="text-muted-foreground text-sm">{subtitle}</Text> : null}
				</View>
			</View>
			{children}
		</ScrollView>
	);
}
