import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The same sheet, more content",
};

const PARAGRAPHS = [
	"A sheet sized to its content needs no snap points, because the content is the measurement.",
	"Add a paragraph and the sheet is taller. Remove one and it is shorter, with nothing said at the call site.",
	"This is gorhom's own default, and this component keeps it — a number here would be a number to retune every time the copy changed.",
];

/** The same composition as the short sheet, with three paragraphs instead of one. */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="secondary">Tall sheet</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Title>Still no numbers</BottomSheet.Title>
						{PARAGRAPHS.map((paragraph) => (
							<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
						))}
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
