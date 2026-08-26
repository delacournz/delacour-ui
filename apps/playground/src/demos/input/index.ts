import { concatDemoGroups } from "../define-demo-group";
import { inputColorsDemos } from "./colors";
import { inputFormDemos } from "./form";
import { inputGroupDemos } from "./group";
import { inputSizesDemos } from "./sizes";
import { inputStatesDemos } from "./states";
import { inputVariantsDemos } from "./variants";

/** Facet order is the order the folder's index route lists them. */
export const inputDemos = concatDemoGroups(
	inputVariantsDemos,
	inputSizesDemos,
	inputStatesDemos,
	inputGroupDemos,
	inputColorsDemos,
	inputFormDemos
);
