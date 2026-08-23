import { Button } from "@delacour/native-ui/button";
import { INPUT_SIZES, Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * The input scale, and the two things it drives beyond the box.
 *
 * The row pairing a field with a button is the reason `--spacing-input-*` names
 * the same numbers as `--spacing-button-*` rather than borrowing them: they are
 * separate scales that a token test asserts stay level, so either can be retuned
 * without silently dragging the other with it.
 */
export default function InputSizesDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle={`${INPUT_SIZES.length} steps`} title="Input sizes">
			<Section title="Sizes">
				<Text.Caption>Size drives the box height, the value's type scale and a decorator's icon together.</Text.Caption>
				<View className="gap-4">
					{INPUT_SIZES.map((size) => (
						<View className="gap-1.5" key={size}>
							<Text.Label>{size}</Text.Label>
							<Input placeholder={`Size ${size}`} size={size} />
						</View>
					))}
				</View>
			</Section>

			<Section title="Beside a button">
				<Text.Caption>
					A field and a button at the same size are the same height. Any drift here is a token that has moved on one
					scale and not the other.
				</Text.Caption>
				<View className="gap-4">
					{INPUT_SIZES.map((size) => (
						<View className="flex-row items-center gap-2" key={size}>
							<View className="flex-1">
								<Input placeholder={size} size={size} />
							</View>
							<Button size={size}>Go</Button>
						</View>
					))}
				</View>
			</Section>

			<Section title="Multiline">
				<Text.Caption>
					A multiline field turns its height into a floor. It starts exactly as tall as a single-line one at the same
					size and grows with the text instead of clipping it.
				</Text.Caption>
				<View className="gap-4">
					{INPUT_SIZES.map((size) => (
						<Input key={size} multiline placeholder={`Notes (${size})`} size={size} />
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
