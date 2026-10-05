import type { ReactNode } from "react";
import type { AlertStatus } from "../alert/alert.variants";
import type { HapticFeedback } from "../pressable/pressable";

/** What the toast says about what just happened — Alert's statuses, so the two read as one family. */
export type ToastStatus = AlertStatus;

/** Which edge of the screen the toast enters from and stacks against. */
export type ToastPlacement = "top" | "bottom";

/** What `toast()` returns: the toast's id and a way to hide it. */
export type ToastHandle = {
	id: string;
	hide: () => void;
};

/** A single trailing action. Pressing it calls `onPress` and hides the toast. */
export type ToastActionOptions = {
	label: string;
	onPress: (handle: ToastHandle) => void;
};

type ToastCommonOptions = {
	/** Pass an existing toast's id to replace it in place rather than adding another. */
	id?: string;
	/** Milliseconds before it hides itself. `0` stays until hidden. Default 4000, 6000 with an action, at least 10000 under a screen reader. */
	duration?: number;
	/** The edge it enters from. Default `"bottom"`. */
	placement?: ToastPlacement;
	/** A haptic played as it appears. Defaults to the status's: success, warning, error, or none. `false` for none. */
	haptic?: HapticFeedback | false;
	/** Called once the toast has left the screen, however it was hidden. */
	onHide?: () => void;
};

export type ToastOptions = ToastCommonOptions & {
	/** Default `"default"`. Picks the glyph, the title's colour and the default haptic. */
	status?: ToastStatus;
	title: string;
	description?: string;
	action?: ToastActionOptions;
	/** Draws a spinner for the glyph and, unless `duration` says otherwise, stays until updated. `toast.promise` sets it. */
	isLoading?: boolean;
};

export type ToastCustomOptions = ToastCommonOptions & {
	/** Draws the whole toast. Compose `<Toast>` inside it to keep the house look. */
	render: (handle: ToastHandle) => ReactNode;
};

/** Anything `toast()` accepts: a title, a message, or a custom render. */
export type ToastInput = string | ToastOptions | ToastCustomOptions;

/** What `toast.update` merges in. A `title` turns a custom toast into a message; a `render` the other way. */
export type ToastPatch = Partial<Omit<ToastOptions, "id">> & { render?: ToastCustomOptions["render"] };

type ToastItemBase = {
	id: string;
	placement: ToastPlacement;
	duration: number | undefined;
	haptic: HapticFeedback | false | undefined;
	onHide: (() => void) | undefined;
	/** Hidden, and animating out. The viewport removes it once the exit ends. */
	isExiting: boolean;
	/** Bumped by every update, so the viewport restarts the clock and announces it again. */
	revision: number;
	/** When it was first shown, ms. */
	createdAt: number;
	/** Its place among toasts shown in the same tick — what the entrance stagger counts. */
	batchIndex: number;
};

export type ToastMessageItem = ToastItemBase & {
	kind: "message";
	status: ToastStatus;
	title: string;
	description: string | undefined;
	action: ToastActionOptions | undefined;
	isLoading: boolean;
};

export type ToastCustomItem = ToastItemBase & {
	kind: "custom";
	render: ToastCustomOptions["render"];
};

/** One toast in the store. */
export type ToastItem = ToastMessageItem | ToastCustomItem;

/** Every toast, oldest first. Exiting toasts stay until the viewport removes them. */
export type ToastState = readonly ToastItem[];

export type ToastStoreAction =
	| { type: "add"; item: ToastItem }
	| { type: "update"; id: string; patch: ToastPatch }
	| { type: "hide"; id: string }
	| { type: "remove"; id: string }
	| { type: "hideAll" };

function isCustomInput(input: ToastOptions | ToastCustomOptions): input is ToastCustomOptions {
	return "render" in input && typeof input.render === "function";
}

/** Turns whatever `toast()` was given into a store item. */
export function normalizeToastInput(
	input: ToastInput,
	context: { id: string; now: number; batchIndex: number }
): ToastItem {
	const options: ToastOptions | ToastCustomOptions = typeof input === "string" ? { title: input } : input;
	const base: ToastItemBase = {
		id: options.id ?? context.id,
		placement: options.placement ?? "bottom",
		duration: options.duration,
		haptic: options.haptic,
		onHide: options.onHide,
		isExiting: false,
		revision: 0,
		createdAt: context.now,
		batchIndex: context.batchIndex,
	};
	if (isCustomInput(options)) return { ...base, kind: "custom", render: options.render };
	return {
		...base,
		kind: "message",
		status: options.status ?? "default",
		title: options.title,
		description: options.description,
		action: options.action,
		isLoading: options.isLoading ?? false,
	};
}

function patchItem(item: ToastItem, patch: ToastPatch): ToastItem {
	const base: ToastItemBase = {
		id: item.id,
		placement: patch.placement ?? item.placement,
		duration: "duration" in patch ? patch.duration : item.duration,
		haptic: "haptic" in patch ? patch.haptic : item.haptic,
		onHide: patch.onHide ?? item.onHide,
		isExiting: item.isExiting,
		revision: item.revision + 1,
		createdAt: item.createdAt,
		batchIndex: item.batchIndex,
	};
	if (patch.render) return { ...base, kind: "custom", render: patch.render };
	if (item.kind === "custom") {
		if (patch.title === undefined) return { ...base, kind: "custom", render: item.render };
		return {
			...base,
			kind: "message",
			status: patch.status ?? "default",
			title: patch.title,
			description: patch.description,
			action: patch.action,
			isLoading: patch.isLoading ?? false,
		};
	}
	return {
		...base,
		kind: "message",
		status: patch.status ?? item.status,
		title: patch.title ?? item.title,
		description: "description" in patch ? patch.description : item.description,
		action: "action" in patch ? patch.action : item.action,
		isLoading: patch.isLoading ?? item.isLoading,
	};
}

/**
 * The store's whole behaviour, as a pure reducer.
 *
 * `hide` only marks a toast exiting, so the viewport can animate it out;
 * `remove` drops it once that exit has run. An action that changes nothing
 * returns the state it was given, so the store can skip notifying anyone.
 */
export function reduceToasts(state: ToastState, action: ToastStoreAction): ToastState {
	switch (action.type) {
		case "add": {
			const index = state.findIndex((item) => item.id === action.item.id);
			if (index === -1) return [...state, action.item];
			const previous = state[index] as ToastItem;
			const replaced: ToastItem = {
				...action.item,
				revision: previous.revision + 1,
				createdAt: previous.createdAt,
				batchIndex: previous.batchIndex,
			};
			return state.map((item, at) => (at === index ? replaced : item));
		}
		case "update": {
			const index = state.findIndex((item) => item.id === action.id);
			if (index === -1) return state;
			return state.map((item, at) => (at === index ? patchItem(item, action.patch) : item));
		}
		case "hide": {
			const index = state.findIndex((item) => item.id === action.id && !item.isExiting);
			if (index === -1) return state;
			return state.map((item, at) => (at === index ? { ...item, isExiting: true } : item));
		}
		case "remove": {
			const next = state.filter((item) => item.id !== action.id);
			return next.length === state.length ? state : next;
		}
		case "hideAll": {
			if (state.every((item) => item.isExiting)) return state;
			return state.map((item) => (item.isExiting ? item : { ...item, isExiting: true }));
		}
		default:
			return state;
	}
}

export type ToastStore = {
	getSnapshot: () => ToastState;
	subscribe: (listener: () => void) => () => void;
	dispatch: (action: ToastStoreAction) => void;
	/** Builds an item for `input`, with a fresh id and its place in this tick's batch. */
	createItem: (input: ToastInput) => ToastItem;
};

/**
 * A tiny external store, read with `useSyncExternalStore`.
 *
 * It lives outside React so `toast()` works from anywhere — an API client, a
 * mutation's `onError` — with no provider and no hook. `schedule` closes the
 * current batch: every toast created before it runs shares one tick, and the
 * viewport staggers their entrances by `batchIndex`.
 */
export function createToastStore({
	now = Date.now,
	schedule = queueMicrotask,
}: {
	now?: () => number;
	schedule?: (task: () => void) => void;
} = {}): ToastStore {
	let state: ToastState = [];
	let counter = 0;
	let batchSize = 0;
	const listeners = new Set<() => void>();

	return {
		getSnapshot: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		dispatch: (action) => {
			const next = reduceToasts(state, action);
			if (next === state) return;
			state = next;
			for (const listener of listeners) listener();
		},
		createItem: (input) => {
			counter += 1;
			if (batchSize === 0) {
				schedule(() => {
					batchSize = 0;
				});
			}
			const batchIndex = batchSize;
			batchSize += 1;
			return normalizeToastInput(input, { id: `toast-${counter}`, now: now(), batchIndex });
		},
	};
}

type ToastShorthand = (title: string, options?: Partial<Omit<ToastOptions, "title" | "status">>) => ToastHandle;

/** The messages `toast.promise` shows while the promise is pending, and once it settles. */
export type ToastPromiseMessages<T> = {
	loading: string;
	success: string | ((value: T) => string);
	error: string | ((error: unknown) => string);
};

/** `toast` — callable with a title or options, and a namespace for the rest. */
export type ToastApi = {
	(input: ToastInput): ToastHandle;
	show: (input: ToastInput) => ToastHandle;
	success: ToastShorthand;
	info: ToastShorthand;
	warning: ToastShorthand;
	/** A `destructive` toast. */
	error: ToastShorthand;
	update: (id: string, patch: ToastPatch) => void;
	hide: (id: string) => void;
	hideAll: () => void;
	/** One toast that says "loading" and becomes the success or the error in place. Resolves or rejects with `promise`. */
	promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>;
};

/** The `toast` function over a store. The library's `toast` is this over one module-level store. */
export function createToastApi(store: ToastStore): ToastApi {
	const hide = (id: string): void => store.dispatch({ type: "hide", id });
	const handleOf = (id: string): ToastHandle => ({ id, hide: () => hide(id) });

	const show = (input: ToastInput): ToastHandle => {
		const item = store.createItem(input);
		store.dispatch({ type: "add", item });
		return handleOf(item.id);
	};

	const shorthand =
		(status: ToastStatus): ToastShorthand =>
		(title, options) =>
			show({ ...options, title, status });

	const update = (id: string, patch: ToastPatch): void => store.dispatch({ type: "update", id, patch });

	function promise<T>(pending: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T> {
		const { id } = show({ title: messages.loading, isLoading: true });
		pending.then(
			(value) => {
				const title = typeof messages.success === "function" ? messages.success(value) : messages.success;
				update(id, { status: "success", title, isLoading: false });
			},
			(error: unknown) => {
				const title = typeof messages.error === "function" ? messages.error(error) : messages.error;
				update(id, { status: "destructive", title, isLoading: false });
			}
		);
		return pending;
	}

	return Object.assign(show, {
		show,
		success: shorthand("success"),
		info: shorthand("info"),
		warning: shorthand("warning"),
		error: shorthand("destructive"),
		update,
		hide,
		hideAll: () => store.dispatch({ type: "hideAll" }),
		promise,
	});
}
