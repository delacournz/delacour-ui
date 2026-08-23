import { Button } from "@delacour/native-ui/button";
import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import {
	IconAt,
	IconCrossSmall,
	IconCurrencyDollar,
	IconEyeOpen,
	IconEyeSlash,
	IconMagnifyingGlass,
	IconShieldCheck,
} from "@delacour/native-ui/icons/central";
import { INPUT_SIZES, Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/** A search field whose clear button appears only once there is something to clear. */
function SearchField(): ReactElement {
	const [value, setValue] = useState("");

	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconMagnifyingGlass} />
			</Input.Group.Prefix>
			<Input onChangeText={setValue} placeholder="Search" value={value} />
			{value.length > 0 ? (
				<Input.Group.Suffix>
					<Button accessibilityLabel="Clear" isIconOnly onPress={() => setValue("")} size="sm" variant="ghost">
						<Icon icon={IconCrossSmall} />
					</Button>
				</Input.Group.Suffix>
			) : null}
		</Input.Group>
	);
}

/** A password field whose suffix toggles the value between hidden and shown. */
function PasswordField(): ReactElement {
	const [isRevealed, setRevealed] = useState(false);

	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconShieldCheck} />
			</Input.Group.Prefix>
			<Input autoCapitalize="none" defaultValue="hunter2" secureTextEntry={!isRevealed} />
			<Input.Group.Suffix>
				<Button
					accessibilityLabel={isRevealed ? "Hide password" : "Show password"}
					isIconOnly
					onPress={() => setRevealed((current) => !current)}
					size="sm"
					variant="ghost"
				>
					<Icon icon={isRevealed ? IconEyeSlash : IconEyeOpen} />
				</Button>
			</Input.Group.Suffix>
		</Input.Group>
	);
}

/**
 * `Input.Group` — prefix and suffix content inside the field's own box.
 *
 * The first section is the acceptance test for the whole component: a lone
 * field directly above a grouped one. They read the same `root` slot of
 * `inputVariants`, which lands on the `TextInput` when a field stands alone and
 * on the group's row when it does not, so the two boxes are the same box rather
 * than two class strings that happen to agree.
 */
export default function InputGroupDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle="Prefix and suffix" title="Input.Group">
			<Section title="Side by side">
				<Text.Caption>
					The same box, drawn twice. Height, radius, border, background and gutters should be indistinguishable — any
					difference here is the design failing at the one thing it exists to guarantee.
				</Text.Caption>
				<View className="gap-4">
					<Field>
						<Field.Label>On its own</Field.Label>
						<Input placeholder="A lone field" />
					</Field>
					<Field>
						<Field.Label>In a group</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>
								<Icon icon={IconMagnifyingGlass} />
							</Input.Group.Prefix>
							<Input placeholder="A grouped field" />
						</Input.Group>
					</Field>
				</View>
			</Section>

			<Section title="Icons">
				<Text.Caption>
					A bare `Icon` needs nothing at the call site — it inherits the field's icon step and a muted colour from the
					decorator.
				</Text.Caption>
				<View className="gap-4">
					<Field>
						<Field.Label>Prefix</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>
								<Icon icon={IconAt} />
							</Input.Group.Prefix>
							<Input autoCapitalize="none" inputMode="email" placeholder="Email" />
						</Input.Group>
					</Field>
					<Field>
						<Field.Label>Suffix</Field.Label>
						<Input.Group>
							<Input placeholder="Amount" inputMode="decimal" />
							<Input.Group.Suffix>
								<Icon icon={IconCurrencyDollar} />
							</Input.Group.Suffix>
						</Input.Group>
					</Field>
					<Field>
						<Field.Label>Both</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>
								<Icon icon={IconCurrencyDollar} />
							</Input.Group.Prefix>
							<Input inputMode="decimal" placeholder="0.00" />
							<Input.Group.Suffix>
								<Icon icon={IconShieldCheck} />
							</Input.Group.Suffix>
						</Input.Group>
					</Field>
				</View>
			</Section>

			<Section title="Text affixes">
				<Text.Caption>
					A bare string is wrapped in a `Text` that inherits the affix treatment, so a currency symbol or a domain is
					written as itself rather than as markup.
				</Text.Caption>
				<View className="gap-4">
					<Field>
						<Field.Label>Currency</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>$</Input.Group.Prefix>
							<Input inputMode="decimal" placeholder="0.00" />
							<Input.Group.Suffix>NZD</Input.Group.Suffix>
						</Input.Group>
					</Field>
					<Field>
						<Field.Label>Domain</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>https://</Input.Group.Prefix>
							<Input autoCapitalize="none" placeholder="example" />
							<Input.Group.Suffix>.com</Input.Group.Suffix>
						</Input.Group>
					</Field>
				</View>
			</Section>

			<Section title="Controls">
				<Text.Caption>
					A `Button` in a decorator keeps its own press. Tapping the gutter beside it focuses the field instead — a
					grouped box behaves the way a lone field's does, edge to edge.
				</Text.Caption>
				<View className="gap-4">
					<Field>
						<Field.Label>Clear</Field.Label>
						<SearchField />
					</Field>
					<Field>
						<Field.Label>Reveal</Field.Label>
						<PasswordField />
					</Field>
				</View>
			</Section>

			<Section title="Sizes and states">
				<Text.Caption>
					The group owns the box, so `variant`, `size`, `isInvalid` and `isDisabled` live on it — one box, one set of
					axes. The decorators follow the invalid state with the border.
				</Text.Caption>
				<View className="gap-4">
					{INPUT_SIZES.map((size) => (
						<Input.Group key={size} size={size}>
							<Input.Group.Prefix>
								<Icon icon={IconMagnifyingGlass} />
							</Input.Group.Prefix>
							<Input placeholder={`Size ${size}`} />
							<Input.Group.Suffix>{size}</Input.Group.Suffix>
						</Input.Group>
					))}
					<Input.Group isInvalid>
						<Input.Group.Prefix>
							<Icon icon={IconAt} />
						</Input.Group.Prefix>
						<Input defaultValue="not-an-email" />
						<Input.Group.Suffix>required</Input.Group.Suffix>
					</Input.Group>
					<Input.Group isDisabled>
						<Input.Group.Prefix>
							<Icon icon={IconMagnifyingGlass} />
						</Input.Group.Prefix>
						<Input defaultValue="Unavailable" />
					</Input.Group>
					<Input.Group variant="secondary">
						<Input.Group.Prefix>
							<Icon icon={IconMagnifyingGlass} />
						</Input.Group.Prefix>
						<Input placeholder="Secondary" />
					</Input.Group>
				</View>
			</Section>

			<Section title="Multiline">
				<Text.Caption>The box grows with the text and the decorators stay on its first line.</Text.Caption>
				<Input.Group>
					<Input.Group.Prefix>
						<Icon icon={IconAt} />
					</Input.Group.Prefix>
					<Input multiline placeholder="Mention someone, at length" />
				</Input.Group>
			</Section>
		</GalleryScreen>
	);
}
