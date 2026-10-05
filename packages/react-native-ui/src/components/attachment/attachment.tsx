import { type ReactElement, type ReactNode, useEffect, useMemo, useRef } from "react";
import {
	type AccessibilityActionEvent,
	AccessibilityInfo,
	type ImageSourcePropType,
	Platform,
	View,
	type ViewProps,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Pressable } from "../pressable";
import {
	type AttachmentContextValue,
	AttachmentProvider,
	useAttachmentGroupContext,
	useAttachmentGroupItem,
} from "./attachment.context";
import type { AttachmentMedia } from "./attachment.types";
import {
	resolveAttachmentAccessibilityLabel,
	resolveAttachmentAccessibilityValue,
	resolveAttachmentActions,
	resolveAttachmentInteractive,
	resolveAttachmentRole,
	resolveFileExtension,
	resolveRemoveLabel,
} from "./attachment.utils";
import {
	ATTACHMENT_ERROR_NUDGE,
	type AttachmentKind,
	type AttachmentLayout,
	type AttachmentSize,
	type AttachmentStatus,
	attachmentVariants,
	resolveAttachmentParts,
} from "./attachment.variants";
import { AttachmentContent } from "./attachment-content";
import { AttachmentGroup } from "./attachment-group";
import { AttachmentMeta } from "./attachment-meta";
import { AttachmentName } from "./attachment-name";
import { AttachmentPreview } from "./attachment-preview";
import { AttachmentProgress } from "./attachment-progress";
import { AttachmentRemove } from "./attachment-remove";
import { AttachmentRetry } from "./attachment-retry";

const DONE: AttachmentStatus = { type: "done" };

type AttachmentOwnProps = {
	/** The file's name, as the user knows it. Shown, and read by a screen reader. */
	name: string;
	/** Shown as `2.4 MB` and read as `2.4 megabytes`. */
	sizeBytes?: number;
	/** Where the upload stands. The app owns it. Default `{ type: "done" }`. */
	status?: AttachmentStatus;
	/** Default `chip`, or the enclosing group's. */
	layout?: AttachmentLayout;
	/** Default `md`, or the enclosing group's. */
	size?: AttachmentSize;
	isDisabled?: boolean;
	/** Opens the attachment — a viewer, a player, QuickLook. */
	onPress?: () => void;
	/** The app's menu trigger. */
	onLongPress?: () => void;
	/** Composes a remove control in. While uploading it reads as cancel. */
	onRemove?: () => void;
	/** Composes a retry control in, shown only in `error`. */
	onRetry?: () => void;
	/** What a screen reader calls the remove action. Default `Remove <name>`, or `Cancel upload`. */
	removeAccessibilityLabel?: string;
	/** `testID` for the composed remove control. */
	removeTestID?: string;
	/** `testID` for the composed retry control. */
	retryTestID?: string;
	className?: string;
	/** Replaces the default preview, name, meta, progress and actions entirely. */
	children?: ReactNode;
};

export type AttachmentProps = AttachmentMedia & Omit<ViewProps, "children"> & AttachmentOwnProps;

/** Every media field, optional — the shape a discriminated `AttachmentMedia` is read through. */
type LooseMedia = {
	kind: AttachmentKind;
	source?: ImageSourcePropType;
	width?: number;
	height?: number;
	durationMs?: number;
	extension?: string;
};

function AttachmentRoot(allProps: AttachmentProps): ReactElement {
	const loose: LooseMedia & Omit<ViewProps, "children"> & AttachmentOwnProps = allProps;
	const {
		kind,
		source,
		width: _width,
		height: _height,
		durationMs,
		extension: extensionProp,
		name,
		sizeBytes,
		status = DONE,
		layout: layoutProp,
		size: sizeProp,
		isDisabled = false,
		onPress,
		onLongPress,
		onRemove,
		onRetry,
		removeAccessibilityLabel,
		removeTestID,
		retryTestID,
		accessibilityLabel,
		accessibilityHint,
		accessibilityActions,
		onAccessibilityAction,
		className,
		children,
		...props
	} = loose;

	const group = useAttachmentGroupContext();
	const groupItem = useAttachmentGroupItem();
	const layout = layoutProp ?? group?.layout ?? "chip";
	const size = sizeProp ?? group?.size ?? "md";
	const extension = kind === "file" ? (extensionProp ?? resolveFileExtension(name)) : undefined;

	const hasHandler = onPress !== undefined || onLongPress !== undefined;
	const isInteractive = resolveAttachmentInteractive({ isDisabled, onLongPress, onPress, status });
	const removeLabel = resolveRemoveLabel({ label: removeAccessibilityLabel, name, status });
	const parts = resolveAttachmentParts({
		hasRemove: onRemove !== undefined,
		hasRetry: onRetry !== undefined,
		status,
	});

	const context = useMemo<AttachmentContextValue>(
		() => ({
			durationMs,
			extension,
			isDisabled,
			isInteractive,
			kind,
			layout,
			name,
			onRemove,
			onRetry,
			removeLabel,
			size,
			sizeBytes,
			source,
			status,
		}),
		[
			durationMs,
			extension,
			isDisabled,
			isInteractive,
			kind,
			layout,
			name,
			onRemove,
			onRetry,
			removeLabel,
			size,
			sizeBytes,
			source,
			status,
		]
	);

	const isCalm = useCalmMotion();
	const offset = useSharedValue(0);
	const errorMessage = status.type === "error" ? status.message : undefined;
	const wasError = useRef(errorMessage !== undefined);

	// One nudge, and one spoken notice, on entering `error` — never on mounting
	// in it, which is a row scrolling back into view rather than news.
	useEffect(() => {
		const was = wasError.current;
		wasError.current = errorMessage !== undefined;
		if (errorMessage === undefined || was) return;

		if (Platform.OS === "ios") {
			AccessibilityInfo.announceForAccessibility(`Upload failed, ${name}, ${errorMessage}`);
		}
		if (isCalm) return;

		const { distance, stepMs } = ATTACHMENT_ERROR_NUDGE;
		offset.value = withSequence(
			withTiming(distance, { duration: stepMs }),
			withTiming(-distance, { duration: stepMs }),
			withTiming(0, { duration: stepMs })
		);
	}, [errorMessage, isCalm, name, offset]);

	const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

	const slots = attachmentVariants({ isDisabled, kind, layout, size, status: status.type });

	const actions = [
		...(accessibilityActions ?? []),
		...resolveAttachmentActions({
			hasLongPress: isInteractive && onLongPress !== undefined,
			hasPress: isInteractive && onPress !== undefined,
			hasRemove: !isDisabled && onRemove !== undefined,
			hasRetry: !isDisabled && onRetry !== undefined,
			removeLabel,
			status,
		}),
	];

	const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
		switch (event.nativeEvent.actionName) {
			case "activate":
				if (isInteractive) onPress?.();
				break;
			case "longpress":
				if (isInteractive) onLongPress?.();
				break;
			case "remove":
				if (!isDisabled) onRemove?.();
				break;
			case "retry":
				if (!isDisabled) onRetry?.();
				break;
		}
		onAccessibilityAction?.(event);
	};

	const label =
		accessibilityLabel ??
		resolveAttachmentAccessibilityLabel({ durationMs, kind, name, sizeBytes, status });
	const hint = accessibilityHint ?? (groupItem ? `${groupItem.index + 1} of ${groupItem.count}` : undefined);

	// The text and the bar a tile draws over its picture belong to the press
	// target; a chip's bar runs along the root's own bottom edge, outside it.
	const body = children ?? (
		<>
			<AttachmentPreview />
			{layout === "card" ? (
				<AttachmentContent>
					<AttachmentName />
					<AttachmentMeta />
					{parts.showsProgress ? <AttachmentProgress /> : null}
				</AttachmentContent>
			) : (
				<AttachmentContent />
			)}
			{layout === "tile" && parts.showsProgress ? <AttachmentProgress /> : null}
		</>
	);

	const press = hasHandler ? (
		<Pressable
			accessible={false}
			className={slots.press()}
			disabled={isDisabled}
			feedback="fade"
			importantForAccessibility="no"
			onLongPress={onLongPress}
			onPress={onPress}
		>
			{body}
		</Pressable>
	) : (
		<View className={slots.press()}>{body}</View>
	);

	const hasActions = children === undefined && (parts.showsRetry || parts.showsRemove);

	return (
		<AttachmentProvider value={context}>
			<Animated.View
				accessibilityActions={actions.length > 0 ? actions : undefined}
				accessibilityHint={hint}
				accessibilityLabel={label}
				accessibilityLiveRegion={status.type === "error" ? "polite" : "none"}
				accessibilityRole={resolveAttachmentRole({ hasHandler, kind })}
				accessibilityState={{ busy: status.type === "uploading", disabled: isDisabled }}
				accessibilityValue={resolveAttachmentAccessibilityValue(status)}
				accessible
				className={slots.root({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				style={nudgeStyle}
				{...props}
			>
				{press}
				{children === undefined && layout === "chip" && parts.showsProgress ? <AttachmentProgress /> : null}
				{hasActions ? (
					<View className={slots.actions()}>
						{parts.showsRetry ? <AttachmentRetry testID={retryTestID} /> : null}
						{parts.showsRemove ? <AttachmentRemove testID={removeTestID} /> : null}
					</View>
				) : null}
			</Animated.View>
		</AttachmentProvider>
	);
}

/**
 * A file, image, video or recording riding along with a message, or waiting in
 * a composer tray — a thumbnail or type glyph, a name, a size, an upload state
 * and a way to take it back out.
 *
 * **Three layouts.** `chip` is the composer pill, `tile` a square thumbnail for
 * a photo tray, `card` a full-width row for inside a message bubble.
 *
 * **Upload is the app's state.** The attachment never uploads anything: it
 * draws `status` and reports `onRemove` and `onRetry`. Uploading shows a bar —
 * determinate with a `progress`, looping without — and the remove control
 * becomes cancel. An error edges the attachment in the destructive colour,
 * swaps the meta line for the app's message, nudges once and offers retry.
 *
 * **The remove and retry controls never open it.** They sit beside the press
 * target rather than inside it. A screen reader meets the attachment as one
 * element — `Photo, vacation.jpg, 2.4 megabytes, uploading`, then the
 * percentage in ten-point steps — with remove and retry as its actions.
 *
 * With no children it draws its default parts. Children replace them entirely,
 * and every part reads the attachment through `useAttachment()`.
 *
 * @example
 * <Attachment kind="file" name="report.pdf" sizeBytes={2_516_582} onRemove={remove} />
 *
 * @example
 * <Attachment
 *   kind="image"
 *   layout="tile"
 *   name="IMG_2041.HEIC"
 *   source={{ uri: asset.uri }}
 *   status={{ type: "uploading", progress: 0.4 }}
 *   onRemove={cancel}
 * />
 *
 * @example
 * <Attachment.Group>
 *   {files.map((file) => (
 *     <Attachment key={file.id} kind="file" name={file.name} onRemove={() => drop(file.id)} />
 *   ))}
 * </Attachment.Group>
 */
export const Attachment = Object.assign(AttachmentRoot, {
	/** The thumbnail — the kind's glyph on its tint, with the picture over it. */
	Preview: AttachmentPreview,
	/** The text column: the name over the meta line. A frosted strip on a tile. */
	Content: AttachmentContent,
	/** The file's name on one line, cut in the middle to keep its extension. */
	Name: AttachmentName,
	/** `2.4 MB · PDF`, a recording's length, or the error message. */
	Meta: AttachmentMeta,
	/** The upload bar, drawn only while uploading. */
	Progress: AttachmentProgress,
	/** The remove control. Cancels while uploading. */
	Remove: AttachmentRemove,
	/** The retry control, for an upload that failed. */
	Retry: AttachmentRetry,
	/** A horizontal tray of attachments that slide together as one is removed. */
	Group: AttachmentGroup,
	displayName: "DelacourUI.Attachment",
});
