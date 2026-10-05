import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/**
 * The shape of a post's layout slots — `Header` and `Footer`. Shared by both,
 * so it lives in a leaf rather than in one of them arbitrarily.
 */
export type PostSlotProps = ViewProps & { className?: string; children?: ReactNode };
