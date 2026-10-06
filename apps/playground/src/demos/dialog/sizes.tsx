import { Button } from "@delacour/react-native-ui/button";
import { DIALOG_SIZES, Dialog, type DialogSize } from "@delacour/react-native-ui/dialog";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"`sm` 320, `md` 400, `lg` 520 and `full`, each a cap on a full-width card — a phone narrower than the cap shows them alike. An `sm` footer stacks its actions.",
	align: "center",
	capture: { flow: "dialog/sizes", frame: "device" },
};

const LABELS: Record<DialogSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
	full: "Full",
};

/** One trigger per size, mapped over the library's own tuple. */
export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{DIALOG_SIZES.map((size) => (
				<Dialog key={size}>
					<Dialog.Trigger asChild>
						<Button testID={`dialog-size-${size}`} variant="outline">
							{LABELS[size]}
						</Button>
					</Dialog.Trigger>
					<Dialog.Content size={size}>
						<Dialog.Header>
							<Dialog.Title>{`${LABELS[size]} dialog`}</Dialog.Title>
							<Dialog.Description>The card fills the gutter up to its size's cap.</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.Close asChild>
								<Button variant="secondary">Cancel</Button>
							</Dialog.Close>
							<Dialog.Close asChild>
								<Button testID={`dialog-size-${size}-done`}>Done</Button>
							</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog>
			))}
		</View>
	);
}
