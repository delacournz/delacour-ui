import { defineDemoGroup } from "../define-demo-group";
import * as counting from "./counting";
import * as orders from "./orders";
import * as revealCharacters from "./reveal-characters";
import * as revealWords from "./reveal-words";
import * as rolling from "./rolling";
import * as rotating from "./rotating";
import * as typing from "./typing";

/** Key order is the gallery's reading order — the root's reveal, then each part, then the orders side by side. */
export const textAnimationDemos = defineDemoGroup("text-animation", {
	"reveal-words": revealWords,
	"reveal-characters": revealCharacters,
	typing,
	rotating,
	counting,
	rolling,
	orders,
});
