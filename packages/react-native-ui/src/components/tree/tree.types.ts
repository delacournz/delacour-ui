import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/**
 * The shape of the row's plain view slots, `Tree.Icon` and `Tree.Actions`.
 *
 * Shared by both parts and by the trigger, which sorts its children by them —
 * three modules, so it lives in a leaf.
 */
export type TreeSlotProps = ViewProps & { className?: string; children?: ReactNode };
