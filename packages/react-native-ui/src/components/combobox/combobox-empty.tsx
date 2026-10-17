import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { Text } from "../text";
import { useComboboxPart } from "./combobox.context";
import { comboboxVariants } from "./combobox.variants";

export type ComboboxEmptyProps = {
	/** What the sheet shows when no row is left. A string is drawn as muted text. */
	children?: ReactNode;
	className?: string;
};

/**
 * What the sheet shows where the rows would be, when there are none.
 *
 * Compose it as a child of `Combobox` to replace the default `emptyText` line —
 * an `EmptyState`, a hint, a button that does something else. The root finds it
 * among its children and draws it inside the sheet; where it is written in the
 * tree does not matter. A plain string is drawn as muted text, announced
 * politely when it appears.
 */
export function ComboboxEmpty({ children, className }: ComboboxEmptyProps): ReactElement {
	const { size } = useComboboxPart("Combobox.Empty");
	const slots = comboboxVariants({ size });
	const content =
		typeof children === "string" ? (
			<Text accessibilityLiveRegion="polite" color="muted">
				{children}
			</Text>
		) : (
			children
		);

	return <View className={slots.empty({ className })}>{content}</View>;
}
ComboboxEmpty.displayName = "DelacourUI.Combobox.Empty";
