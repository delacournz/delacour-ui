import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { cancelAnimation, useSharedValue, withSpring } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type MenuSubContextValue, MenuSubProvider } from "./menu.context";
import { MENU_SUB_SPRING } from "./menu.variants";

export type MenuSubProps = {
	children: ReactNode;
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
};

/**
 * A nested group of rows that expands in place under its `Menu.SubTrigger`.
 *
 * It never flies out to a second panel: on a phone there is no room beside the
 * first, and a second layer over the first hides where the user came from. The
 * rows push the ones below down, with `Collapsible`'s measured height and spring.
 *
 * @example
 * <Menu.Sub>
 *   <Menu.SubTrigger icon={IconFolder1}>Move to</Menu.SubTrigger>
 *   <Menu.SubContent>
 *     <Menu.Item onSelect={moveToInbox}>Inbox</Menu.Item>
 *   </Menu.SubContent>
 * </Menu.Sub>
 */
export function MenuSub({
	children,
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
}: MenuSubProps): ReactElement {
	const changeRef = useRef(onOpenChange);
	changeRef.current = onOpenChange;
	const handleChange = useCallback((next: boolean) => changeRef.current?.(next), []);

	const [isOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: handleChange,
		value: isOpenProp,
	});

	const openRef = useRef(isOpen);
	openRef.current = isOpen;
	const toggle = useCallback(() => setOpen(!openRef.current), [setOpen]);

	const progress = useSharedValue(isOpen ? 1 : 0);
	const contentHeight = useSharedValue(-1);

	// React state, never a JS-thread read of `contentHeight` — the write is queued
	// onto the UI runtime and a read straight after it can still see -1.
	const [isMeasured, setMeasured] = useState(false);
	const onMeasured = useCallback(() => setMeasured(true), []);

	useEffect(() => {
		if (isOpen && !isMeasured) return;
		progress.value = withSpring(isOpen ? 1 : 0, MENU_SUB_SPRING);
		return () => cancelAnimation(progress);
	}, [isMeasured, isOpen, progress]);

	const context = useMemo<MenuSubContextValue>(
		() => ({ contentHeight, isOpen, onMeasured, progress, toggle }),
		[contentHeight, isOpen, onMeasured, progress, toggle]
	);

	return (
		<MenuSubProvider value={context}>
			<View>{children}</View>
		</MenuSubProvider>
	);
}
MenuSub.displayName = "DelacourUI.Menu.Sub";
