import { useSyncExternalStore } from "react";
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
