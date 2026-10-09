import { type ReactElement, type ReactNode, useCallback } from "react";
import { Icon, type IconComponent } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useSelectionModePart } from "./selection-mode.context";
import { SELECTION_MODE_ACTION_FOREGROUND_TOKEN, selectionModeVariants } from "./selection-mode.variants";

export type SelectionModeActionProps = {
	/** The label, under the icon. */
	children: ReactNode;
	icon?: IconComponent;
	/** Called with the selection as it stands at the press. */
	onPress: (selected: string[]) => void;
	/** Leave the mode once `onPress` has run. */
	isExitOnPress?: boolean;
	/** Draw the label and icon in the destructive colour. */
	isDestructive?: boolean;
	isDisabled?: boolean;
	className?: string;
	labelClassName?: string;
};

/**
 * One action in the bar: an icon over a label, sharing the bar's width evenly
 * with its siblings.
 *
 * `onPress` receives the current selection, so the handler never closes over a
 * stale one. `isExitOnPress` leaves the mode afterwards — a delete or an archive,
 * whose picks no longer exist to stay picked.
 */
export function SelectionModeAction({
	children,
	icon,
	onPress,
	isExitOnPress = false,
	isDestructive = false,
	isDisabled = false,
	className,
	labelClassName,
}: SelectionModeActionProps): ReactElement {
	const { selected, exit } = useSelectionModePart("SelectionMode.Action");
	const slots = selectionModeVariants({ isDestructive, isDisabled });
	const token = SELECTION_MODE_ACTION_FOREGROUND_TOKEN[isDestructive ? "destructive" : "default"];

	const handlePress = useCallback(() => {
		onPress([...selected]);
		if (isExitOnPress) exit();
	}, [exit, isExitOnPress, onPress, selected]);

	return (
		<Pressable
			accessibilityLabel={typeof children === "string" ? children : undefined}
			className={slots.action({ className })}
			disabled={isDisabled}
			feedback="fade"
			onPress={handlePress}
		>
			{icon ? <Icon color={token} icon={icon} size="xl" /> : null}
			<Text className={slots.actionLabel({ className: labelClassName })} numberOfLines={1}>
				{children}
			</Text>
		</Pressable>
	);
}
SelectionModeAction.displayName = "DelacourUI.SelectionMode.Action";
