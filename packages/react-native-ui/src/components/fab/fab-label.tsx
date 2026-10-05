import type { ReactElement, ReactNode } from "react";
import { Text, type TextProps } from "../text";
import { useFabPart } from "./fab.context";
import { fabVariants } from "./fab.variants";

export type FabLabelProps = Omit<TextProps, "children"> & { children: ReactNode; className?: string };

/**
 * An extended fab's text.
 *
 * Carries its own colour, read from the fab's variant: a `View` does not cascade
 * colour to a `Text`, so a colour on the root would be lost.
 */
export function FabLabel({ className, ...props }: FabLabelProps): ReactElement {
	const { variant } = useFabPart("Fab.Label");
	return <Text className={fabVariants({ variant }).label({ className })} numberOfLines={1} {...props} />;
}
FabLabel.displayName = "DelacourUI.Fab.Label";
