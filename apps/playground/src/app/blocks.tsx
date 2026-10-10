import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconChart1,
	IconInboxEmpty,
	IconLayoutTopBottom,
	IconLock,
	IconPassword,
	IconPeople,
	IconReceiptBill,
	IconSettingsSliderHor,
} from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Surface } from "@delacour/react-native-ui/surface";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { BLOCKS, type BlockSlug } from "@/blocks/block-index";
import { BlockScreen } from "@/components/block-screen";

/**
 * One glyph per block, keyed by slug so a row added to `block-index.ts`
 * without a glyph here is a type error rather than a blank prefix.
 */
const BLOCK_ICONS: Record<BlockSlug, IconComponent> = {
	shell: IconLayoutTopBottom,
	settings: IconSettingsSliderHor,
	"sign-in": IconLock,
	otp: IconPassword,
	dashboard: IconChart1,
	members: IconPeople,
	invoices: IconReceiptBill,
	"empty-states": IconInboxEmpty,
};

/**
 * Every block, one row each, in `block-index.ts` order.
 *
 * Framed by `BlockScreen` — the same chrome each block it lists wears — so the
 * list and the screens it opens read as one place.
 */
export default function Blocks(): ReactElement {
	const router = useRouter();

	return (
		<BlockScreen subtitle={`${BLOCKS.length} screens`} title="Blocks">
			<Surface material="tray">
				<ListGroup className="rounded-xl">
					{BLOCKS.map((block) => (
						<ListGroup.Item
							haptic="selection"
							key={block.slug}
							onPress={() => router.push(block.href)}
							testID={`blocks-${block.slug}`}
						>
							<ListGroup.ItemPrefix>
								<Icon icon={BLOCK_ICONS[block.slug]} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{block.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{block.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>
			</Surface>
		</BlockScreen>
	);
}
