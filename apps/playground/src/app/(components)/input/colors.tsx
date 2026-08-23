import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const SELECTION_ACCENTS = ["accent-primary", "accent-info", "accent-success", "accent-warning"] as const;

/** A labelled field, so a stack of them reads as a form. */
function Field({ children, label }: { children: ReactNode; label: string }): ReactElement {
	return (
		<View className="gap-1.5">
			<Text.Label>{label}</Text.Label>
			{children}
		</View>
	);
}

/**
 * The three colours a `TextInput` takes as a value rather than a style.
 *
 * These are the props a className normally cannot reach. Uniwind bridges them
 * by compiling the class and reading its `accentColor`, which is why every value
 * here is an `accent-*` utility — a `text-*` one compiles to a colour uniwind
 * never looks at, so the prop is left undefined and the platform default stands.
 */
export default function InputColorsDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle="Placeholder, caret, selection" title="Input colours">
			<Section title="Defaults">
				<Text.Caption>
					Nothing is passed here. The placeholder is the muted token and the caret is primary, so both follow the theme
					— toggle light and dark from the gallery index and they move with it.
				</Text.Caption>
				<Field label="Default">
					<Input defaultValue="Select this text" placeholder="A themed placeholder" />
				</Field>
			</Section>

			<Section title="Placeholder">
				<Text.Caption>
					`placeholderColorClassName` replaces the default. It is the only name for this colour — uniwind's
					`placeholderTextColorClassName` is removed from the prop surface so the two cannot disagree.
				</Text.Caption>
				<View className="gap-4">
					<Field label="accent-foreground">
						<Input placeholderColorClassName="accent-foreground" placeholder="Full contrast" />
					</Field>
					<Field label="accent-info">
						<Input placeholderColorClassName="accent-info" placeholder="Informational" />
					</Field>
				</View>
			</Section>

			<Section title="Caret and selection">
				<Text.Caption>
					`selectionColorClassName` drives both the caret and the selection highlight. Tap a field and select the text
					to see it.
				</Text.Caption>
				<View className="gap-4">
					{SELECTION_ACCENTS.map((accent) => (
						<Field key={accent} label={accent}>
							<Input defaultValue="Select this text" selectionColorClassName={accent} />
						</Field>
					))}
				</View>
			</Section>

			<Section title="Invalid wins by default, and loses to a caller">
				<Text.Caption>
					An invalid field turns its caret danger without being told. Passing a class still overrides it — the default
					is a default, not a rule.
				</Text.Caption>
				<View className="gap-4">
					<Field label="Invalid, untouched">
						<Input defaultValue="Select this text" isInvalid />
					</Field>
					<Field label="Invalid, overridden">
						<Input defaultValue="Select this text" isInvalid selectionColorClassName="accent-info" />
					</Field>
				</View>
			</Section>
		</GalleryScreen>
	);
}
