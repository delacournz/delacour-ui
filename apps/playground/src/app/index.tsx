import { Icon } from "@delacour/react-native-ui/icon";
import { IconArrowUpRight, IconShieldCheck } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Screen } from "@delacour/react-native-ui/screen";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { DelacourMark } from "@/components/delacour-mark";
import { HubCard } from "@/components/hub-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { HUB_CARDS } from "@/lib/hub-cards";
import { openWebPage } from "@/lib/open-web-page";
import { PRIVACY_POLICY_URL } from "@/lib/privacy-url";
import { LIST_GAP, SECTION_GAP } from "@/tokens";

/** The size the mark is drawn at in the navbar: the navbar's own icon step, at life size. */
const MARK_SIZE = 28;

/**
 * The large title, at the platform's own step: 34 over 41, semibold.
 *
 * Arbitrary values rather than a scale step because `text-3xl` is 30 and the
 * scale has no 34; the pair is written together so the leading survives the
 * size. Not a playground `@theme` token either: the library's tailwind-merge
 * reads an unknown `text-large-title` as a text colour and drops
 * `text-foreground`, painting the title in the default black. No tracking: the
 * heading face is the house mono, and a mono tracked in loses its grid.
 *
 * The family comes from `font-heading` on `Text.Display`. That utility
 * resolved to nothing until `styles/global.css` declared `--font-heading`
 * itself, because the library's `theme.css` sets it only inside its platform
 * `@variant` blocks and Tailwind mints no class from those. The store's
 * `applyConfig` then rewrites the variable from the Heading axis.
 */
const LARGE_TITLE_CLASS = "font-semibold text-[34px] leading-[41px]";

/**
 * The hub the app opens on: two doors, one to the component galleries and one
 * to the blocks.
 *
 * The mark leads a static navbar and "Delacour UI" opens the content as a large
 * title in the heading face — the one typeset lockup the brand has. Under it,
 * one `HubCard` per entry in `HUB_CARDS`, each a full-width etched panel whose
 * count is read from the index the screen behind it draws.
 *
 * The About group closes the screen with the privacy policy link App Review
 * requires inside the app, not only on the listing. Its suffix is an outbound
 * arrow rather than the chevron, because the row opens a web page in the
 * in-app browser instead of pushing a screen — see `lib/open-web-page.ts`.
 */
export default function Index(): ReactElement {
	const openPrivacyPolicy = () => {
		void openWebPage(PRIVACY_POLICY_URL);
	};

	return (
		<Screen>
			<Screen.Navbar actions={<ThemeToggle />} placement="static">
				<DelacourMark accessibilityLabel="Delacour" accessibilityRole="image" size={MARK_SIZE} />
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
				<Text.Display accessibilityRole="header" className={LARGE_TITLE_CLASS}>
					Delacour UI
				</Text.Display>

				{HUB_CARDS.map((card) => (
					<HubCard card={card} key={card.slug} />
				))}

				<View className={SECTION_GAP}>
					<Text.Kicker>About</Text.Kicker>
					<Surface material="tray">
						<ListGroup className="rounded-xl">
							<ListGroup.Item
								accessibilityHint="Opens a web page"
								accessibilityRole="link"
								haptic="selection"
								onPress={openPrivacyPolicy}
								testID="home-privacy-policy"
							>
								<ListGroup.ItemPrefix>
									<Icon icon={IconShieldCheck} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Privacy policy</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>What this app sends, and to whom</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix>
									<Icon icon={IconArrowUpRight} />
								</ListGroup.ItemSuffix>
							</ListGroup.Item>
						</ListGroup>
					</Surface>
				</View>
			</Screen.ScrollArea>
			<Screen.ScrollShadow />
		</Screen>
	);
}
