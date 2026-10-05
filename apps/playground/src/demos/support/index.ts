import { defineDemoGroup } from "../define-demo-group";
import * as articles from "./articles";
import * as availability from "./availability";
import * as conversations from "./conversations";
import * as disabledChannel from "./disabled-channel";
import * as escalation from "./escalation";
import * as helpScreen from "./help-screen";
import * as resolution from "./resolution";
import * as thread from "./thread";
import * as topics from "./topics";

/** Key order is the gallery's reading order — the landing route, its sections, then a thread's furniture. */
export const supportDemos = defineDemoGroup("support", {
	"help-screen": helpScreen,
	availability,
	"disabled-channel": disabledChannel,
	topics,
	conversations,
	articles,
	thread,
	escalation,
	resolution,
});
