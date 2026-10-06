import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { IconDefaultsProvider } from "../icon";
import {
	type ToastContextValue,
	ToastProvider,
	type ToastRegisteredAction,
	useToastItemContext,
} from "./toast.context";
import type { ToastStatus } from "./toast.store";
import { resolveToastRole, TOAST_FOREGROUND_TOKEN, toastVariants } from "./toast.variants";
import { ToastAction } from "./toast-action";
import { ToastClose } from "./toast-close";
import { ToastContent } from "./toast-content";
import { ToastDescription } from "./toast-description";
import { ToastIndicator } from "./toast-indicator";
import { ToastTitle } from "./toast-title";

export type ToastProps = ViewProps & {
	className?: string;
	/** What the toast says: `default`, `info`, `success`, `warning` or `destructive`. Picks the glyph and the title's colour. */
	status?: ToastStatus;
	/** Hides the toast — the close control, the action and a screen reader's dismiss call it. Inside the viewport it defaults to hiding the toast being drawn. */
	onHide?: () => void;
	children?: ReactNode;
};

function noop(): void {}

function ToastRoot({
	status = "default",
	onHide,
	className,
	children,
	accessibilityActions,
	onAccessibilityAction,
	...props
}: ToastProps): ReactElement {
	const item = useToastItemContext();
	const hide = onHide ?? item?.hide ?? noop;
	const [action, setAction] = useState<ToastRegisteredAction | null>(null);

	const context = useMemo<ToastContextValue>(() => ({ status, hide, registerAction: setAction }), [status, hide]);

	const slots = toastVariants({ status });
	const iconClassName = slots.icon();
	const iconColor = TOAST_FOREGROUND_TOKEN[status];
	const iconDefaults = useMemo(() => ({ className: iconClassName, color: iconColor }), [iconClassName, iconColor]);

	const actions = useMemo(
		() => [
			...(action ? [{ name: "activate", label: action.label }] : []),
			{ name: "escape" },
			{ name: "dismiss", label: "Dismiss" },
			...(accessibilityActions ?? []),
		],
		[action, accessibilityActions]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const { actionName } = event.nativeEvent;
			if (actionName === "activate" && action) action.run();
			else if (actionName === "escape" || actionName === "dismiss") hide();
			onAccessibilityAction?.(event);
		},
		[action, hide, onAccessibilityAction]
	);

	// One accessible element: VoiceOver and TalkBack read the title and the
	// description as one message, and the action and ✕ are its actions rather
	// than two more stops. It never takes focus — it is announced instead.
	return (
		<ToastProvider value={context}>
			<View
				accessibilityActions={actions}
				accessibilityLiveRegion="polite"
				accessibilityRole={resolveToastRole(status)}
				accessible
				className={slots.root({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				{...props}
			>
				<IconDefaultsProvider value={iconDefaults}>{children}</IconDefaultsProvider>
			</View>
		</ToastProvider>
	);
}

/**
 * The toast card — a glyph, a title, a description, an action and a ✕ — on a
 * `popover` surface with a hairline.
 *
 * The viewport draws one of these for every `toast()`; compose it yourself
 * only inside a custom `render`, where it keeps the house look and hides the
 * toast it is drawn in with no `onHide` of its own. `status` is Alert's
 * vocabulary and colours the glyph and the title from Alert's token, so a toast
 * and an alert saying the same thing read as one family.
 *
 * One accessible element: the title and the description are read as one
 * message, the action is its `activate` and the ✕ its `escape` and "Dismiss".
 * `role="alert"` for a failure; a polite live region on Android.
 *
 * @example
 * toast.show({
 *   render: ({ hide }) => (
 *     <Toast status="success">
 *       <Toast.Indicator />
 *       <Toast.Content>
 *         <Toast.Title>Invite sent</Toast.Title>
 *         <Toast.Description>priya@example.com can join now.</Toast.Description>
 *       </Toast.Content>
 *       <Toast.Close />
 *     </Toast>
 *   ),
 * });
 */
export const Toast = Object.assign(ToastRoot, {
	/** The leading status glyph — Alert's for the same status. Children replace it. */
	Indicator: ToastIndicator,
	/** The column holding the title and the description. */
	Content: ToastContent,
	/** What happened, in the status's colour. */
	Title: ToastTitle,
	/** A muted line under the title. */
	Description: ToastDescription,
	/** One compact text button; pressing it also hides the toast. */
	Action: ToastAction,
	/** A trailing ✕ that hides the toast. */
	Close: ToastClose,
	displayName: "DelacourUI.Toast",
});
