import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useTablePart } from "./table.context";
import { tableVariants } from "./table.variants";

export type TableCaptionProps = TextPresetProps;

/**
 * A note about the table — "Prices include GST". Drawn under it, outside a wide
 * table's scroller, and read after the body.
 */
export function TableCaption({ className, ...props }: TableCaptionProps): ReactElement {
	const { size } = useTablePart("Table.Caption");
	return <Text.Caption className={tableVariants({ size }).caption({ className })} {...props} />;
}
TableCaption.displayName = "DelacourUI.Table.Caption";
