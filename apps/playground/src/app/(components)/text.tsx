import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import { TEXT_ALIGNS, TEXT_COLORS, TEXT_SIZES, TEXT_TRANSFORMS, TEXT_WEIGHTS, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const LOREM =
	"A nested Text adopts the treatment around it and overrides only the axes it names, which is what React Native does natively with a nested Text's style.";

export default function TextGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="Type scale, presets, inline nesting" title="Text">
			<Section title="Type scale">
				<View className="gap-3">
					<Text.Display>Display</Text.Display>
					<Text.Title>Title</Text.Title>
					<Text.Header>Header</Text.Header>
					<Text.Subheader>Subheader</Text.Subheader>
					<Text.Paragraph>Paragraph</Text.Paragraph>
					<Text.Label>Label</Text.Label>
					<Text.Caption>Caption</Text.Caption>
					<Text.Overline>Overline</Text.Overline>
				</View>
			</Section>

			<Section title="Inline presets">
				<Text.Caption>
					An inline preset emits only its delta, so it takes the size and colour of the text around it. Standing alone
					it falls back to the base treatment — React Native's own default colour does not follow the theme.
				</Text.Caption>
				<Text.Title>
					Nested in a title: <Text.Strong>strong</Text.Strong>, <Text.Emphasis>emphasis</Text.Emphasis>,{" "}
					<Text.Link>link</Text.Link>, <Text.Code>code</Text.Code>.
				</Text.Title>
				<View className="flex-row flex-wrap items-center gap-3">
					<Text.Strong>strong</Text.Strong>
					<Text.Emphasis>emphasis</Text.Emphasis>
					<Text.Link>link</Text.Link>
					<Text.Code>code</Text.Code>
				</View>
			</Section>

			<Section title="Nesting">
				<Text.Caption>A bare nested Text inherits everything; naming one axis changes only that axis.</Text.Caption>
				<Text.Title>
					Total <Text color="muted">USD</Text>
				</Text.Title>
				<Text.Paragraph>
					One <Text>level</Text>, then{" "}
					<Text weight="bold">
						two <Text color="danger">levels</Text>
					</Text>{" "}
					deep.
				</Text.Paragraph>
			</Section>

			<Section title="Size">
				<View className="gap-2">
					{TEXT_SIZES.map((size) => (
						<Text key={size} size={size}>
							size {size}
						</Text>
					))}
				</View>
			</Section>

			<Section title="Colour">
				<Text.Caption>
					Text drawn on a coloured surface is that surface's job, not this axis — the pill below writes the utility
					directly.
				</Text.Caption>
				<View className="gap-2">
					{TEXT_COLORS.map((color) => (
						<Text color={color} key={color}>
							color {color}
						</Text>
					))}
					<View className="self-start rounded-full bg-danger px-3 py-1">
						<Text className="font-semibold text-danger-foreground text-xs">on a danger surface</Text>
					</View>
				</View>
			</Section>

			<Section title="Weight">
				<View className="gap-2">
					{TEXT_WEIGHTS.map((weight) => (
						<Text key={weight} weight={weight}>
							weight {weight}
						</Text>
					))}
				</View>
			</Section>

			<Section title="Alignment">
				<View className="gap-2 rounded-lg border border-border p-3">
					{TEXT_ALIGNS.map((align) => (
						<Text align={align} className="w-full" key={align}>
							align {align}
						</Text>
					))}
				</View>
			</Section>

			<Section title="Transform">
				<View className="gap-2">
					{TEXT_TRANSFORMS.map((transform) => (
						<Text key={transform} transform={transform}>
							transform {transform}
						</Text>
					))}
					<Text.Overline transform="none">an overline with its uppercase cleared</Text.Overline>
				</View>
			</Section>

			<Section title="Code">
				<Text.Caption>
					A nested Text is laid out by the platform's text engine, not by Yoga — padding and rounded corners are ignored
					on both platforms, so only the standalone form is padded.
				</Text.Caption>
				<Text.Paragraph>
					Run <Text.Code>bun test</Text.Code> before you commit.
				</Text.Paragraph>
				<View className="flex-row">
					<Text.Code>bun run gen-exports</Text.Code>
				</View>
				<View className="rounded-lg bg-muted p-3">
					<Text.Code className="bg-transparent" size="sm">
						bun run typecheck
					</Text.Code>
				</View>
			</Section>

			<Section title="Truncation">
				<Text.Paragraph numberOfLines={1}>{LOREM}</Text.Paragraph>
				<Text.Paragraph numberOfLines={2}>{LOREM}</Text.Paragraph>
			</Section>

			<Section title="Inside other components">
				<Text.Caption>
					A nested preset inherits the enclosing component's own type scale, not the library's. A bare Text in a Button
					picks up the label treatment with nothing said at the call site.
				</Text.Caption>
				<Button>
					<Button.Label>
						Save <Text.Strong>now</Text.Strong>
					</Button.Label>
				</Button>
				<Button variant="secondary">
					<Text>a bare Text, inheriting the label</Text>
				</Button>
				<ListGroup>
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>
								Row with <Text.Strong>emphasis</Text.Strong>
							</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								Description with <Text color="danger">a colour</Text>
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			</Section>
		</GalleryScreen>
	);
}
