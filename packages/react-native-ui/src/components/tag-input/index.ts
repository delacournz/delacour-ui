export { TagInput, type TagInputProps } from "./tag-input";
export { type TagInputContextValue, TagInputProvider, useTagInput, useTagInputContext } from "./tag-input.context";
export {
	commitDraft,
	DEFAULT_REJECT_MESSAGES,
	evaluateAdd,
	ingestText,
	isOverflowing,
	normalizeTag,
	REJECT_HAPTIC_INTERVAL_MS,
	resolveBackspace,
	resolveBlur,
	resolveCounterText,
	resolveSubmit,
	resolveTagInputState,
	shouldHideInput,
	splitByDelimiters,
	type TagInputAddOptions,
	type TagInputAddResult,
	type TagInputBackspaceAction,
	type TagInputCommitOptions,
	type TagInputCommitResult,
	type TagInputState,
} from "./tag-input.logic";
export type {
	TagInputBlurBehavior,
	TagInputHandle,
	TagInputRejection,
	TagInputRejectReason,
	TagInputTagState,
} from "./tag-input.types";
export {
	resolveTagInputBoxClass,
	resolveTagInputChip,
	resolveTagInputFieldClass,
	TAG_INPUT_CHIP_SIZE,
	type TagInputVariantProps,
	tagInputVariants,
} from "./tag-input.variants";
