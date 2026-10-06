import { defineDemoGroup } from "../define-demo-group";
import * as directions from "./directions";
import * as emojiAndPlain from "./emoji-and-plain";
import * as longPress from "./long-press";
import * as reactions from "./reactions";
import * as rtl from "./rtl";
import * as runs from "./runs";
import * as status from "./status";
import * as typing from "./typing";
import * as withAttachments from "./with-attachments";

/** Key order is the gallery's reading order — the two sides, a run, the receipt, what hangs off a bubble, then the edge cases. */
export const messageDemos = defineDemoGroup("message", {
	directions,
	runs,
	status,
	reactions,
	typing,
	"with-attachments": withAttachments,
	"long-press": longPress,
	"emoji-and-plain": emojiAndPlain,
	rtl,
});
