export { Attachment, type AttachmentProps } from "./attachment";
export {
	type AttachmentContextValue,
	type AttachmentGroupContextValue,
	type AttachmentGroupItemValue,
	AttachmentProvider,
	useAttachment,
	useAttachmentContext,
	useAttachmentGroupItem,
} from "./attachment.context";
export type { AttachmentMedia, AttachmentMediaFields, AttachmentSlotProps } from "./attachment.types";
export {
	type AttachmentAccessibilityAction,
	type AttachmentSource,
	clampProgress,
	formatDuration,
	formatFileSize,
	resolveAttachmentAccessibilityLabel,
	resolveAttachmentAccessibilityValue,
	resolveAttachmentKind,
	resolveAttachmentMeta,
	resolveFileExtension,
	resolveProgressAnnouncement,
	spokenDuration,
	spokenFileSize,
	truncateMiddle,
} from "./attachment.utils";
export {
	ATTACHMENT_ACTION_EDGE,
	ATTACHMENT_ACTION_FOREGROUND_TOKEN,
	ATTACHMENT_ACTION_HIT_SLOP,
	ATTACHMENT_ERROR_NUDGE,
	ATTACHMENT_GROUP_FADE_MS,
	ATTACHMENT_GROUP_GAPS,
	ATTACHMENT_KIND_TONE,
	ATTACHMENT_KINDS,
	ATTACHMENT_LAYOUTS,
	ATTACHMENT_SIZE_POINTS,
	ATTACHMENT_SIZES,
	ATTACHMENT_STATUS_TYPES,
	type AttachmentGroupGap,
	type AttachmentKind,
	type AttachmentLayout,
	type AttachmentParts,
	type AttachmentSize,
	type AttachmentStatus,
	type AttachmentStatusType,
	type AttachmentVariantProps,
	attachmentVariants,
	resolveAttachmentParts,
} from "./attachment.variants";
export type { AttachmentContentProps } from "./attachment-content";
export type { AttachmentGroupProps } from "./attachment-group";
export type { AttachmentMetaProps } from "./attachment-meta";
export type { AttachmentNameProps } from "./attachment-name";
export { ATTACHMENT_KIND_ICON, type AttachmentPreviewProps } from "./attachment-preview";
export type { AttachmentProgressProps } from "./attachment-progress";
export type { AttachmentRemoveProps } from "./attachment-remove";
export type { AttachmentRetryProps } from "./attachment-retry";
