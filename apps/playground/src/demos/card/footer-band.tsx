import { Button } from "@delacour/react-native-ui/button";
import { CARD_FOOTER_VARIANTS, Card, type CardFooterVariant } from "@delacour/react-native-ui/card";
import { Radio } from "@delacour/react-native-ui/radio";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Footer band",
	caption:
		'`variant="band"` sets the footer into the card: a rule across its top, the next fill down, and the card\'s own bottom corners — for a footer that is what somebody does with the card rather than more of what it says.',
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<CardFooterVariant, string> = {
	default: "Default",
	band: "Band",
};

function isFooterVariant(value: string): value is CardFooterVariant {
	return (CARD_FOOTER_VARIANTS as readonly string[]).includes(value);
}

export function Demo(): ReactElement {
	const [footer, setFooter] = useState<CardFooterVariant>("band");
	const [isInvited, setInvited] = useState(false);

	return (
		<View className="gap-6">
			<Card testID="card-band">
				<Card.Header>
					<Card.Title>Team workspace</Card.Title>
					<Card.Description>Four members, two pending invites.</Card.Description>
				</Card.Header>
				<Card.Content>
					<Text.Caption>Everyone on the team can edit projects and billing.</Text.Caption>
				</Card.Content>
				<Card.Footer className="justify-between" testID="card-band-footer" variant={footer}>
					<Text.Caption testID="card-band-status">{isInvited ? "Invite sent" : "No invite sent"}</Text.Caption>
					<Button
						isDisabled={isInvited}
						onPress={() => setInvited(true)}
						size="sm"
						testID="card-band-invite"
						variant="outline"
					>
						Invite
					</Button>
				</Card.Footer>
			</Card>
			<View className="gap-2">
				<Text.Overline>Footer</Text.Overline>
				<Radio.Group
					accessibilityLabel="Footer"
					onSelected={(value) => isFooterVariant(value) && setFooter(value)}
					orientation="horizontal"
					selected={footer}
				>
					{CARD_FOOTER_VARIANTS.map((name) => (
						<Radio key={name} testID={`card-band-footer-${name}`} value={name}>
							{LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
		</View>
	);
}
