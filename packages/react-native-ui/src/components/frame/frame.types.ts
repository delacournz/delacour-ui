import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { TextPresetProps } from "../text";

/** The shape of a frame's layout parts — `Header`, and extended by `Section` and `Footer`. */
export type FrameSlotProps = ViewProps & { className?: string; children?: ReactNode };

/** The shape of a frame's two text parts, `Title` and `Description`. */
export type FrameTextProps = TextPresetProps;
