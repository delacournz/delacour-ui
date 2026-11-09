import { useSyncExternalStore } from "react";
import type { SharedValue } from "react-native-reanimated";
import {
	createToastOffsetStore,
	type ToastOffsetRegistration,
	type ToastOffsetSources,
	type ToastOffsetStore,
} from "./toast.offset";
import { createToastApi, createToastStore, type ToastApi, type ToastState } from "./toast.store";

/**
 * The one store every `toast()` call writes to and the viewport reads.
 *
 * Module scope on purpose: `toast` has to work where no hook can be called —
 * an API client, a mutation's `onError`, a plain function in a service module.
 */
export const toastStore = createToastStore();

/**
 * Shows a toast from anywhere, inside React or out.
 *
 * Call it with a title, with options, or with a `render` for a custom card.
 * `toast.success` / `.info` / `.warning` / `.error` set the status;
 * `toast.update`, `.hide` and `.hideAll` act on what is shown; `toast.promise`
 * shows one toast that turns into the success or the failure in place.
 * Nothing appears until a `<ToastViewport />` is mounted.
 *
 * @example
 * toast("Link copied");
 * toast.error("Upload failed", { action: { label: "Retry", onPress: retry } });
 * await toast.promise(save(), { loading: "Saving…", success: "Saved", error: "Could not save" });
 */
export const toast: ToastApi = createToastApi(toastStore);

/** `toast`, and every toast in the store — shown, queued and leaving — oldest first. */
export function useToast(): { toast: ToastApi; toasts: ToastState } {
	const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot);
	return { toast, toasts };
}

/**
 * The edge offsets `ToastViewport` reads: shared values saying how much of each
 * screen edge app chrome covers. Write to it with `useToastOffset`, or with
 * `setToastOffset` outside React.
 */
export const toastOffsetStore: ToastOffsetStore<SharedValue<number>> = createToastOffsetStore();

/**
 * Lifts toasts clear of app chrome from outside React — a navigation listener,
 * a layout service. Pass shared values and drive them yourself; the viewport
 * reads them on the UI thread. Keep the registration and `release` it when the
 * chrome goes. In a component, `useToastOffset` does all of this for you.
 *
 * @example
 * const barHeight = makeMutable(84);
 * const registration = setToastOffset({ bottom: barHeight });
 * barHeight.value = withTiming(0); // the bar hides, the toasts follow
 * registration.release();
 */
export function setToastOffset(
	sources: ToastOffsetSources<SharedValue<number>>
): ToastOffsetRegistration<SharedValue<number>> {
	return toastOffsetStore.set(sources);
}
