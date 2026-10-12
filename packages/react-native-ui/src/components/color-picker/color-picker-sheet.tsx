import type { ReactElement, ReactNode } from "react";
import { BottomSheet } from "../bottom-sheet";
import type { InputProps } from "../input";

export type ColorPickerSheetProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	children?: ReactNode;
};

/**
 * The sheet a `presentation="sheet"` picker opens — the one file in this folder
 * that imports `BottomSheet`.
 *
 * Kept to one file so the dependency is visible: the `color-picker` subpath
 * requires the sheet engine because this module imports it statically, inline
 * picker or not, the way `chart` requires the charts engine. Nothing here is
 * rendered unless the picker presents in a sheet, and `BottomSheet` never
 * imports `ColorPicker`, so there is no cycle to guard.
 *
 * The root takes the picker's own open state, so the trigger, a `Field` row press
 * and a controlled `isOpen` all drive one sheet.
 */
export function ColorPickerSheet({ isOpen, onOpenChange, children }: ColorPickerSheetProps): ReactElement {
	return (
		<BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
			{children}
		</BottomSheet>
	);
}
ColorPickerSheet.displayName = "DelacourUI.ColorPicker.Sheet";

export type ColorPickerSheetContentProps = {
	className?: string;
	children?: ReactNode;
};

/** The sheet's surface — scrim, panel and a static body sized to the picker. */
export function ColorPickerSheetContent({ className, children }: ColorPickerSheetContentProps): ReactElement {
	return (
		<BottomSheet.Portal>
			<BottomSheet.Overlay />
			<BottomSheet.Container>
				<BottomSheet.Content className={className}>{children}</BottomSheet.Content>
			</BottomSheet.Container>
		</BottomSheet.Portal>
	);
}
ColorPickerSheetContent.displayName = "DelacourUI.ColorPicker.Sheet.Content";

/**
 * The hex field, registered with the sheet, so the keyboard it raises is the
 * sheet's to lift for rather than one that covers the field.
 */
export function ColorPickerSheetInput(props: InputProps): ReactElement {
	return <BottomSheet.TextInput {...props} />;
}
ColorPickerSheetInput.displayName = "DelacourUI.ColorPicker.Sheet.Input";
