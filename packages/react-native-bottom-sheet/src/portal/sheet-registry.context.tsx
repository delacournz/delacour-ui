import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { INITIAL_REGISTRY, reduceRegistry, type SheetRegistryState, type StackBehavior } from "./sheet-registry";

/** What a sheet hands the registry so it can be closed from outside. */
export type SheetRegistryMethods = {
	close: () => void;
	forceClose: () => void;
};

export type SheetRegistryValue = {
	/** The open set and its z-order. React state: a change re-renders every presented sheet's frame. */
	state: SheetRegistryState;
	/** A root registers its methods on mount; the cleanup unregisters. */
	register: (id: string, methods: SheetRegistryMethods) => () => void;
	/** A portal reports that its sheet is presented, in which host, and how it stacks. */
	present: (id: string, host: string, behavior: StackBehavior) => void;
	/** The sheet's close settled, or its portal unmounted. */
	dismissed: (id: string) => void;
	dismiss: (id: string) => void;
	dismissAll: () => void;
};

export const SheetRegistryContext = createContext<SheetRegistryValue | null>(null);
SheetRegistryContext.displayName = "DelacourBottomSheet.RegistryContext";

export function useSheetRegistry(): SheetRegistryValue {
	const value = useContext(SheetRegistryContext);
	if (value === null) {
		throw new Error(
			"[@delacour/react-native-bottom-sheet] useSheetRegistry outside <BottomSheetProvider>. Mount the provider at the app root."
		);
	}
	return value;
}

export function useOptionalSheetRegistry(): SheetRegistryValue | null {
	return useContext(SheetRegistryContext);
}

/** What `useBottomSheetRegistry()` returns — the two things an app does to sheets it does not hold a ref to. */
export type BottomSheetRegistryValue = {
	/** Closes every presented sheet, in every host. */
	dismissAll: () => void;
	/** Closes one sheet by the id its root registered. Unknown ids are nothing. */
	dismiss: (id: string) => void;
};

/**
 * The app's handle on every open sheet. Throws outside `BottomSheetProvider`:
 * there is no registry to ask without one.
 */
export function useBottomSheetRegistry(): BottomSheetRegistryValue {
	const { dismissAll, dismiss } = useSheetRegistry();
	return useMemo(() => ({ dismissAll, dismiss }), [dismissAll, dismiss]);
}

export function useOptionalBottomSheetRegistry(): BottomSheetRegistryValue | null {
	const registry = useOptionalSheetRegistry();
	return useMemo(
		() => (registry === null ? null : { dismissAll: registry.dismissAll, dismiss: registry.dismiss }),
		[registry]
	);
}

/**
 * Holds the registry: the pure reducer's state, mirrored into React state for
 * the frames that read a `zIndex` from it, and a map from sheet id to the
 * methods a root registered.
 *
 * The reducer runs against a ref and its result is then set, rather than
 * inside a `setState` updater, because a `replace` open has a side effect —
 * telling the displaced sheets to close — and an updater may run twice.
 */
export function SheetRegistryProvider({ children }: { children?: ReactNode }): ReactElement {
	const current = useRef<SheetRegistryState>(INITIAL_REGISTRY);
	const [state, setState] = useState<SheetRegistryState>(INITIAL_REGISTRY);
	const methods = useRef(new Map<string, SheetRegistryMethods>());

	const register = useCallback((id: string, sheet: SheetRegistryMethods) => {
		methods.current.set(id, sheet);
		return () => {
			if (methods.current.get(id) === sheet) methods.current.delete(id);
		};
	}, []);

	const present = useCallback((id: string, host: string, behavior: StackBehavior) => {
		const result = reduceRegistry(current.current, { type: "open", id, host, behavior });
		current.current = result.state;
		setState(result.state);
		for (const victim of result.closed) methods.current.get(victim)?.close();
	}, []);

	const dismissed = useCallback((id: string) => {
		const result = reduceRegistry(current.current, { type: "close", id });
		if (result.state === current.current) return;
		current.current = result.state;
		setState(result.state);
	}, []);

	const dismiss = useCallback((id: string) => {
		methods.current.get(id)?.close();
	}, []);

	const dismissAll = useCallback(() => {
		for (const entry of current.current.open) methods.current.get(entry.id)?.close();
	}, []);

	const value = useMemo<SheetRegistryValue>(
		() => ({ state, register, present, dismissed, dismiss, dismissAll }),
		[state, register, present, dismissed, dismiss, dismissAll]
	);

	return <SheetRegistryContext.Provider value={value}>{children}</SheetRegistryContext.Provider>;
}
SheetRegistryProvider.displayName = "DelacourBottomSheet.RegistryProvider";
