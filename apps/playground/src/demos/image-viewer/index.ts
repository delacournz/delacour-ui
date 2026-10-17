import { defineDemoGroup } from "../define-demo-group";
import * as captionsFullSource from "./captions-full-source";
import * as controlled from "./controlled";
import * as customThumbnail from "./custom-thumbnail";
import * as dataModeList from "./data-mode-list";
import * as dragToDismiss from "./drag-to-dismiss";
import * as galleryGrid from "./gallery-grid";
import * as zoom from "./zoom";

/** Key order is the gallery's reading order — the gallery, its gestures, its sources, then state and lists. */
export const imageViewerDemos = defineDemoGroup("image-viewer", {
	"gallery-grid": galleryGrid,
	zoom,
	"drag-to-dismiss": dragToDismiss,
	"captions-full-source": captionsFullSource,
	"custom-thumbnail": customThumbnail,
	controlled,
	"data-mode-list": dataModeList,
});
