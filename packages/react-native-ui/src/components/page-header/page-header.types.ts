import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/** A part that is a plain view around its children — `Content`, `Actions`. */
export type PageHeaderSlotProps = Omit<ViewProps, "children"> & {
	className?: string;
	children?: ReactNode;
};
