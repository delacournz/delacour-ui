import type { ReactNode } from "react";
import type { TextProps, ViewProps } from "react-native";

/** The shape of a tile's layout slots — `Background`, `Media`, `Footer` and `Actions`. */
export type GridItemSlotProps = ViewProps & { className?: string; children?: ReactNode };

/** The shape of a tile's three text parts — `Title`, `Value` and `Description`. */
export type GridItemTextProps = TextProps & { className?: string };
