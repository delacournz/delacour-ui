import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sized to its content",
};

/**
 * Dynamic sizing is gorhom's default and this component keeps it, so the common
 * case — a title, some copy and two buttons — needs no numbers at all.
 */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="secondary">Short sheet</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Title>One line</BottomSheet.Title>
						<BottomSheet.Description>The sheet is exactly as tall as this.</BottomSheet.Description>
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
