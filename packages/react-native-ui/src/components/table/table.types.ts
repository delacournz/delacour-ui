import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { TableColumnOverride } from "./table.variants";

/** Props shared by the table's block parts — `Header`, `Body`, `Footer`, `Empty`. */
export type TableSlotProps = Omit<ViewProps, "children"> & {
	className?: string;
	children?: ReactNode;
};

/** Props shared by `Table.Head` and `Table.Cell`. */
export type TableCellBaseProps = Omit<ViewProps, "children"> & {
	/** Overrides this cell's column — a `width`, a `flex` or an `align` — over the table's `columns`. */
	column?: TableColumnOverride;
	/** Merged onto the `Text` a bare string or number child is wrapped in. */
	labelClassName?: string;
	className?: string;
	children?: ReactNode;
};
