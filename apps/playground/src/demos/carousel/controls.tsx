import { Carousel } from "@delacour/react-native-ui/carousel";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controls",
	caption: "Previous, dots and next in a row. The arrows disable at the ends of a run that does not loop.",
};

const STEPS = [
	{ id: "welcome", title: "Welcome", body: "Everything you need, one swipe at a time." },
	{ id: "sync", title: "Sync", body: "Your work follows you between devices." },
	{ id: "share", title: "Share", body: "Invite anyone with a link." },
	{ id: "done", title: "Ready", body: "That is the tour. Off you go." },
] as const;

export function Demo(): ReactElement {
	return (
		<Carousel accessibilityLabel="Tour" testID="carousel-controls">
			<Carousel.Content aspectRatio={1.6}>
				{STEPS.map((step, index) => (
					<Carousel.Item className="bg-muted" key={step.id} testID={`carousel-item-${index}`}>
						<View className="flex-1 items-center justify-center gap-2 p-6">
							<Text.Header>{step.title}</Text.Header>
							<Text className="text-center" color="muted">
								{step.body}
							</Text>
						</View>
					</Carousel.Item>
				))}
			</Carousel.Content>
			<Carousel.Controls>
				<Carousel.Previous testID="carousel-previous" />
				<Carousel.Dots testID="carousel-dots" />
				<Carousel.Next testID="carousel-next" />
			</Carousel.Controls>
		</Carousel>
	);
}
