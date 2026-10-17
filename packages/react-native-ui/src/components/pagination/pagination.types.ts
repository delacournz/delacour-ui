import type { PressableProps } from "../pressable/pressable";

/**
 * The props every pressable target in the run shares — an item, a control and a
 * gap. `asChild` is withheld: each target draws its own label, so there is no
 * single child to render into.
 */
export type PaginationTargetProps = Omit<PressableProps, "asChild" | "children"> & {
	className?: string;
};
