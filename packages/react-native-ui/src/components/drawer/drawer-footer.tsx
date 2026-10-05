import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { drawerVariants } from "./drawer.variants";

export type DrawerFooterProps = ViewProps & { className?: string };

/**
 * Actions at the panel's far end, under a hairline: a row, right-aligned in a
 * left-to-right layout. It pushes itself to the panel's end with `mt-auto`, so
 * it sits at the bottom however short the content is — with or without a body.
 *
 * @example
 * <Drawer.Footer>
 *   <Button variant="secondary" onPress={reset}>Reset</Button>
 *   <Drawer.Close asChild><Button>Show results</Button></Drawer.Close>
 * </Drawer.Footer>
 */
export function DrawerFooter({ className, ...props }: DrawerFooterProps): ReactElement {
	return <View className={drawerVariants().footer({ className })} {...props} />;
}
DrawerFooter.displayName = "DelacourUI.Drawer.Footer";
