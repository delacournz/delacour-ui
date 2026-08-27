import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "@registry/ui/text";
import { bottomSheetVariants } from "./bottom-sheet.variants";

export type BottomSheetTitleProps = TextPresetProps;

/**
 * The sheet's heading.
 *
 * *Is* a `Text.Header` — it renders the preset and adds layout, never a size or a
 * weight of its own, the same trade `Field.Label` makes with `Text.Label`. A
 * `text-lg font-semibold` here would be a second definition of that preset which
 * could drift from it, and the tests assert the slot carries neither.
 *
 * The preset already announces itself as a heading, so a screen reader reaches
 * the sheet's purpose first with nothing said at the call site.
 *
 * @example
 * <BottomSheet.Title>Keep yourself safe</BottomSheet.Title>
 */
export function BottomSheetTitle({ className, ...props }: BottomSheetTitleProps): ReactElement {
	return <Text.Header className={bottomSheetVariants().title({ className })} {...props} />;
}
BottomSheetTitle.displayName = "DelacourUI.BottomSheet.Title";
