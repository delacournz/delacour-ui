import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconBell, IconGlobe, IconLock, IconUser } from "@delacour/native-ui/icons/central";
import { LIST_GROUP_SIZES, LIST_GROUP_VARIANTS, ListGroup } from "@delacour/native-ui/list-group";
import { PRESSABLE_FEEDBACKS } from "@delacour/native-ui/pressable";
import { Separator } from "@delacour/native-ui/separator";
import { Spinner } from "@delacour/native-ui/spinner";
import type { ReactElement } from "react";
import { useState } from "react";
import { Text, View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

export default function ListGroupGallery(): ReactElement {
	const [pressCount, setPressCount] = useState(0);
	const bump = () => setPressCount((n) => n + 1);

	return (
		<GalleryScreen subtitle={`Pressed ${pressCount} times`} title="ListGroup">
			<Section title="Variants">
				<View className="gap-4">
					{LIST_GROUP_VARIANTS.map((variant) => (
						<ListGroup key={variant} variant={variant}>
							<ListGroup.Item onPress={bump}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{variant}</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>Surface for the {variant} variant</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
							<ListGroup.Item onPress={bump}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Second row</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
						</ListGroup>
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<Text className="text-muted-foreground text-sm">
					Size drives the row metrics, the type scale, both icon sizes and the divider inset together.
				</Text>
				<View className="gap-4">
					{LIST_GROUP_SIZES.map((size) => (
						<ListGroup key={size} size={size}>
							<ListGroup.Item onPress={bump}>
								<ListGroup.ItemPrefix>
									<Icon icon={IconUser} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>size {size}</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>Name, email, phone number</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
							<ListGroup.Item onPress={bump}>
								<ListGroup.ItemPrefix>
									<Icon icon={IconLock} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Security</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>Password, two-factor</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
						</ListGroup>
					))}
				</View>
			</Section>

			<Section title="Title only">
				<ListGroup>
					<ListGroup.Item onPress={bump}>Wi-Fi</ListGroup.Item>
					<ListGroup.Item onPress={bump}>Bluetooth</ListGroup.Item>
					<ListGroup.Item onPress={bump}>Airplane mode</ListGroup.Item>
				</ListGroup>
				<Text className="text-muted-foreground text-sm">
					A bare string child is wrapped in a title inside a content column — React Native would crash on it otherwise.
				</Text>
			</Section>

			<Section title="Custom suffix">
				<ListGroup>
					<ListGroup.Item onPress={bump}>
						<ListGroup.ItemPrefix>
							<Icon icon={IconGlobe} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Language</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Text className="text-muted-foreground text-sm">English</Text>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
					<ListGroup.Item onPress={bump}>
						<ListGroup.ItemPrefix>
							<Icon icon={IconBell} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<View className="h-6 w-6 items-center justify-center rounded-full bg-danger">
								<Text className="font-bold text-danger-foreground text-xs">7</Text>
							</View>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
					<ListGroup.Item onPress={bump}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Syncing</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Spinner color="muted-foreground" size="sm" />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
					<ListGroup.Item onPress={bump}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Custom chevron</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>iconProps tunes the default glyph</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix iconProps={{ color: "danger", size: 22 }} />
					</ListGroup.Item>
				</ListGroup>
			</Section>

			<Section title="Press feedback">
				<Text className="text-muted-foreground text-sm">
					`fade` is the default: a full-bleed row that scales reads as the whole card flexing. `scale-fade` does both at
					once.
				</Text>
				<ListGroup>
					{PRESSABLE_FEEDBACKS.map((feedback) => (
						<ListGroup.Item feedback={feedback} haptic="selection" key={feedback} onPress={bump}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{feedback}</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								<Icon color="muted-foreground" icon={IconArrowRight} size={16} />
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
					))}
				</ListGroup>
			</Section>

			<Section title="Disabled row">
				<ListGroup>
					<ListGroup.Item onPress={bump}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Available</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<ListGroup.Item isDisabled onPress={bump}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Unavailable</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Blocked, dimmed and announced as disabled</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			</Section>

			<Section title="Dividers">
				<Text className="text-muted-foreground text-sm">
					Off entirely with {"`isDivided={false}`"}; a hand-placed Separator suppresses the automatic one at that gap.
				</Text>
				<View className="gap-4">
					<ListGroup isDivided={false}>
						<ListGroup.Item onPress={bump}>No divider</ListGroup.Item>
						<ListGroup.Item onPress={bump}>Between these rows</ListGroup.Item>
					</ListGroup>
					<ListGroup>
						<ListGroup.Item onPress={bump}>Automatic divider below</ListGroup.Item>
						<ListGroup.Item onPress={bump}>Full-bleed divider below</ListGroup.Item>
						<Separator />
						<ListGroup.Item onPress={bump}>Last row</ListGroup.Item>
					</ListGroup>
				</View>
			</Section>

			<Section title="Separator on its own">
				<View className="gap-3">
					<Text className="text-base text-foreground">Above</Text>
					<Separator />
					<Text className="text-base text-foreground">Below</Text>
					<View className="flex-row items-center gap-3">
						<Text className="text-base text-foreground">Left</Text>
						<Separator className="h-4" orientation="vertical" />
						<Text className="text-base text-foreground">Right</Text>
					</View>
				</View>
			</Section>
		</GalleryScreen>
	);
}
