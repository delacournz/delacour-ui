import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as controlledDraft from "./controlled-draft";
import * as multiStep from "./multi-step";
import * as sending from "./sending";
import * as withChips from "./with-chips";

/** Key order is the gallery's reading order — the hero, the async send, the steps, the chips, then control. */
export const feedbackDemos = defineDemoGroup("feedback", {
	basic,
	sending,
	"multi-step": multiStep,
	"with-chips": withChips,
	"controlled-draft": controlledDraft,
});
