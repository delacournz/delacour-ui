import { defineDemoGroup } from "../define-demo-group";
import * as conversation from "./conversation";
import * as disabled from "./disabled";
import * as pressable from "./pressable";
import * as running from "./running";
import * as variants from "./variants";

/** Key order is the gallery's reading order — in context first, then the variants, then what a marker can do. */
export const markerDemos = defineDemoGroup("marker", {
	conversation,
	variants,
	pressable,
	running,
	disabled,
});
