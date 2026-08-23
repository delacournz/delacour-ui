import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * The three levels above a single field, and the rule between them.
 *
 * The separator section is the one to check on a surface: this implementation
 * draws two rules with the label between them rather than one rule with an
 * opaque label parked on top of it, so it does not need to know what colour it
 * is sitting on. The card below is the case that catches the other approach.
 */
export default function FieldGroupingDemo(): ReactElement {
	return (
		<GalleryScreen keyboardAware subtitle="Set, group and separator" title="Field grouping">
			<Section title="Group">
				<Text.Caption>
					Spacing, and nothing else. `Field.Group` inserts no dividers — unlike `ListGroup`, where a wall of rows needs
					them. Fields are already held apart by whitespace.
				</Text.Caption>
				<Field.Group>
					<Field>
						<Field.Label>First name</Field.Label>
						<Input placeholder="Ada" />
					</Field>
					<Field>
						<Field.Label>Last name</Field.Label>
						<Input placeholder="Lovelace" />
					</Field>
				</Field.Group>
			</Section>

			<Section title="Set and legend">
				<Text.Caption>
					A group is spacing; a set is meaning. Reach for a set when the fields share a heading.
				</Text.Caption>
				<Field.Set>
					<Field.Legend>Billing address</Field.Legend>
					<Field.Description>Where the invoice is sent, if it differs from the delivery address.</Field.Description>
					<Field.Group>
						<Field>
							<Field.Label>Street</Field.Label>
							<Input placeholder="12 Cuba Street" />
						</Field>
						<Field>
							<Field.Label>City</Field.Label>
							<Input placeholder="Wellington" />
						</Field>
					</Field.Group>
				</Field.Set>
			</Section>

			<Section title="A nested set">
				<Text.Caption>
					`variant="label"` drops the legend to the treatment the fields already use, so an inner heading does not
					compete with the outer one.
				</Text.Caption>
				<Field.Set>
					<Field.Legend>Notifications</Field.Legend>
					<Field.Group>
						<Field.Set>
							<Field.Legend variant="label">Email</Field.Legend>
							<Field>
								<Field.Label>Address</Field.Label>
								<Input inputMode="email" placeholder="ada@example.com" />
							</Field>
						</Field.Set>
						<Field.Set>
							<Field.Legend variant="label">Mobile</Field.Legend>
							<Field>
								<Field.Label>Number</Field.Label>
								<Input inputMode="tel" placeholder="021 555 0100" />
							</Field>
						</Field.Set>
					</Field.Group>
				</Field.Set>
			</Section>

			<Section title="Separator">
				<Text.Caption>
					Unlabelled it is one full-width rule; labelled it is two rules with the text between them.
				</Text.Caption>
				<Field.Group>
					<Field>
						<Field.Label>Work email</Field.Label>
						<Input inputMode="email" placeholder="ada@work.example" />
					</Field>
					<Field.Separator />
					<Field>
						<Field.Label>Personal email</Field.Label>
						<Input inputMode="email" placeholder="ada@home.example" />
					</Field>
					<Field.Separator>Or continue with</Field.Separator>
					<Field>
						<Field.Label>Recovery code</Field.Label>
						<Input autoCapitalize="characters" placeholder="XXXX-XXXX" />
					</Field>
				</Field.Group>
			</Section>

			<Section title="Separator on a card">
				<Text.Caption>
					The label is drawn between two rules rather than on top of one, so it needs no background of its own. On a
					card, an implementation that punched a hole with an opaque label would show a block of the page colour here.
				</Text.Caption>
				<View className="rounded-2xl border border-border bg-card p-4">
					<Field.Group>
						<Field>
							<Field.Label>Card number</Field.Label>
							<Input inputMode="numeric" placeholder="4242 4242 4242 4242" />
						</Field>
						<Field.Separator>Or pay another way</Field.Separator>
						<Field>
							<Field.Label>Voucher code</Field.Label>
							<Input autoCapitalize="characters" placeholder="GIFT-2026" />
						</Field>
					</Field.Group>
				</View>
			</Section>
		</GalleryScreen>
	);
}
