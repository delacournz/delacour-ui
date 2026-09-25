import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { TextPresetProps } from "../text";

/** The shape of a KPI's layout parts — `Header`, `Icon`, `Action`, `Content` and `Stat`. */
export type KpiSlotProps = ViewProps & { className?: string; children?: ReactNode };

/** The shape of a KPI's text parts, `Title` and `Value`. */
export type KpiTextProps = TextPresetProps;
