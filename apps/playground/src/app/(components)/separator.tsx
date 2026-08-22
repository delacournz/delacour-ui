import { ListGroup } from "@delacour/native-ui/list-group";
import { SEPARATOR_ORIENTATIONS, Separator } from "@delacour/native-ui/separator";
import type { ReactElement } from "react";
import { Text, View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const INSETS = ["", "mx-4", "mx-10"] as const;

export default function SeparatorGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="A one-pixel rule, hidden from assistive tech" title="Separator">
			<Section title="Orientations">
				<View className="gap-4">
					<View className="gap-3">
						<Text className="text-base text-foreground">Above</Text>
						<Separator />
						<Text className="text-base text-foreground">Below</Text>
					</View>
					<View className="flex-row items-center gap-3">
						<Text className="text-base text-foreground">Left</Text>
						<Separator className="h-4" orientation="vertical" />
						<Text className="text-base text-foreground">Middle</Text>
						<Separator className="h-4" orientation="vertical" />
						<Text className="text-base text-foreground">Right</Text>
					</View>
				</View>
				<Text className="text-muted-foreground text-sm">
					A vertical separator needs a height from somewhere — its parent&apos;s, or its own.
				</Text>
			</Section>

			<Section title="Insets">
				<Text className="text-muted-foreground text-sm">
					The rule stretches to its parent rather than claiming a percentage width, so a margin insets it evenly instead
					of pushing it off the far edge.
				</Text>
				<View className="gap-4 rounded-2xl border border-border bg-card p-4">
					{INSETS.map((inset) => (
						<View className="gap-3" key={inset || "none"}>
							<Text className="text-muted-foreground text-xs">{inset || "no inset"}</Text>
							<Separator className={inset} />
						</View>
					))}
				</View>
			</Section>

			<Section title="Weight and colour">
				<Text className="text-muted-foreground text-sm">
					A filled box, not a border, so thickness and colour are ordinary utilities.
				</Text>
				<View className="gap-4">
					<Separator />
					<Separator className="h-0.5" />
					<Separator className="h-1 bg-primary" />
					<Separator className="h-1 rounded-full bg-danger" />
				</View>
			</Section>

			<Section title="Stretching to a parent">
				<Text className="text-muted-foreground text-sm">
					In a row the vertical rule takes the row&apos;s height with no height of its own.
				</Text>
				<View className="flex-row items-stretch rounded-2xl border border-border bg-card">
					<View className="flex-1 gap-1 p-4">
						<Text className="font-semibold text-2xl text-card-foreground">128</Text>
						<Text className="text-muted-foreground text-sm">Components</Text>
					</View>
					<Separator orientation="vertical" />
					<View className="flex-1 gap-1 p-4">
						<Text className="font-semibold text-2xl text-card-foreground">12</Text>
						<Text className="text-muted-foreground text-sm">Packages</Text>
					</View>
				</View>
			</Section>

			<Section title="Inside a ListGroup">
				<Text className="text-muted-foreground text-sm">
					ListGroup inserts these itself. A hand-placed one suppresses the automatic divider at that gap, which is how a
					full-bleed rule gets in among inset ones.
				</Text>
				<ListGroup>
					<ListGroup.Item>Automatic inset divider below</ListGroup.Item>
					<ListGroup.Item>Hand-placed full-bleed rule below</ListGroup.Item>
					<Separator />
					<ListGroup.Item>Last row</ListGroup.Item>
				</ListGroup>
			</Section>

			<Section title="Orientation tokens">
				<View className="flex-row flex-wrap gap-2">
					{SEPARATOR_ORIENTATIONS.map((orientation) => (
						<View className="rounded-lg bg-tertiary px-3 py-2" key={orientation}>
							<Text className="text-sm text-tertiary-foreground">{orientation}</Text>
						</View>
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
