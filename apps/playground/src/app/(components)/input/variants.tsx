import { INPUT_VARIANTS, Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, type ReactNode, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/** A labelled field, so a row of them reads as a form rather than a stack of boxes. */
function Field({ children, label }: { children: ReactNode; label: string }): ReactElement {
	return (
		<View className="gap-1.5">
			<Text.Label>{label}</Text.Label>
			{children}
		</View>
	);
}

/**
 * The two variants across every state the box can be in.
 *
 * Focus is the one state that cannot be rendered on demand — tap a field to see
 * the border move to the ring token, and tap an invalid one to confirm it stays
 * danger rather than going grey the moment it is being corrected.
 */
export default function InputVariantsDemo(): ReactElement {
	const [value, setValue] = useState("");

	return (
		<GalleryScreen keyboardAware subtitle="primary and secondary" title="Input variants">
			<Section title="At rest">
				<Text.Caption>
					`primary` sits on a card with a visible border; `secondary` is a filled field with none, for a surface that
					already has one.
				</Text.Caption>
				<View className="gap-4">
					{INPUT_VARIANTS.map((variant) => (
						<Field key={variant} label={variant}>
							<Input onChangeText={setValue} placeholder="Type here" value={value} variant={variant} />
						</Field>
					))}
				</View>
			</Section>

			<Section title="Focused">
				<Text.Caption>Tap a field. The border moves to the ring token and returns on blur.</Text.Caption>
				<View className="gap-4">
					{INPUT_VARIANTS.map((variant) => (
						<Field key={variant} label={variant}>
							<Input placeholder="Tap me" variant={variant} />
						</Field>
					))}
				</View>
			</Section>

			<Section title="Invalid">
				<Text.Caption>
					The border, the caret and the selection highlight all turn danger. Tap one — invalid outranks focus, so it
					stays danger while the value is being fixed.
				</Text.Caption>
				<View className="gap-4">
					{INPUT_VARIANTS.map((variant) => (
						<Field key={variant} label={variant}>
							<Input defaultValue="not-an-email" isInvalid variant={variant} />
						</Field>
					))}
				</View>
			</Section>

			<Section title="Disabled">
				<Text.Caption>`isDisabled` fades the box and blocks editing — the field cannot be focused at all.</Text.Caption>
				<View className="gap-4">
					{INPUT_VARIANTS.map((variant) => (
						<Field key={variant} label={variant}>
							<Input defaultValue="Locked" isDisabled variant={variant} />
						</Field>
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
