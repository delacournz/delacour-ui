export { FlipCard, type FlipCardHandle, type FlipCardProps } from "./flip-card";
export {
	type FlipCardContextValue,
	FlipCardProvider,
	type FlipCardState,
	useFlipCard,
	useFlipCardContext,
} from "./flip-card.context";
export type { FlipCardFaceProps } from "./flip-card.types";
export {
	FLIP_CARD_AXES,
	FLIP_CARD_DEFAULT_FACE_LABELS,
	FLIP_CARD_FACES,
	FLIP_CARD_MOTION,
	FLIP_CARD_MOTIONS,
	FLIP_CARD_TRIGGERS,
	type FlipCardAxis,
	type FlipCardFace,
	type FlipCardMotion,
	type FlipCardTrigger,
	type FlipCardVariantProps,
	faceFromRotation,
	flipCardVariants,
	normalizeRotation,
	resolveFlipFaces,
	resolveFlipTarget,
} from "./flip-card.variants";
export type { FlipCardTriggerProps } from "./flip-card-trigger";
