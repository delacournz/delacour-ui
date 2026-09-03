import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dynamic, but capped",
	note: "The capped sheet stops growing but does not scroll — content past the cap is unreachable. That is what BottomSheet.ScrollView is for.",
};

const PARAGRAPHS = [
	"A sheet sized to its content needs no snap points, because the content is the measurement.",
	"Add a paragraph and the sheet is taller. Remove one and it is shorter, with nothing said at the call site.",
	"This is gorhom's own default, and this component keeps it — a number here would be a number to retune every time the copy changed.",
];

/** `maxDynamicContentSize` stops the measurement growing past a ceiling. */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="outline">Capped at 320pt</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container maxDynamicContentSize={320}>
					<BottomSheet.Content>
						<BottomSheet.Title>More content than fits</BottomSheet.Title>
						{PARAGRAPHS.map((paragraph) => (
							<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
						))}
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
