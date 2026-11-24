/**
 * Every string the library speaks or shows on its own, keyed by component, with English defaults.
 *
 * One catalog, and it imports nothing. A component's label type cannot live in its own folder and
 * still be named here: the registry follows type-only imports, so a typed map importing
 * `TourLabels` from `tour/` would drag every component into every copy that reads a label. A
 * catalog with no imports costs each copy one strings file instead.
 *
 * Precedence, weakest first: these defaults, then `DelacourProvider`'s `labels`, then the
 * component's own `labels` prop. An `undefined` at any layer is an absence, never a value, so a
 * spread of optional props cannot blank a string.
 *
 * A label that carries a number is a function, so a language can order and inflect it as it
 * needs — "Page 3", "3. Seite". The resolvers that compose a spoken sentence take the resolved
 * labels as an argument and stay pure.
 */

/** Alert's spoken strings. */
export type AlertLabels = {
	/** The close control's accessible name. */
	dismiss: string;
	/**
	 * The one sentence spoken when the alert appears or changes. Called only when both parts have
	 * text; the title is closed with a full stop unless it already ends in punctuation.
	 */
	announcement: (title: string, description: string) => string;
};

/** What an attachment is, as the catalog names it. Restates `AttachmentKind`: the catalog imports nothing. */
export type AttachmentLabelKind = "image" | "video" | "audio" | "file";

/** A file-size step, smallest first. */
export type AttachmentSizeUnit = "byte" | "kilobyte" | "megabyte" | "gigabyte" | "terabyte";

/** Attachment's visible and spoken strings. */
export type AttachmentLabels = {
	/** The kind, read first: "Photo". */
	kind: (kind: AttachmentLabelKind) => string;
	/** A size as shown, its number already formatted: "2.4 MB". */
	fileSize: (formatted: string, unit: AttachmentSizeUnit) => string;
	/** A size as spoken; `amount` is the rounded value `formatted` shows: "2.4 megabytes". */
	spokenFileSize: (amount: number, formatted: string, unit: AttachmentSizeUnit) => string;
	/** A length as spoken, "1 minute 5 seconds". Seconds are said when nothing else is. */
	spokenDuration: (parts: { hours: number; minutes: number; seconds: number }) => string;
	/** The visible meta line's non-empty parts joined: "1:05 · 1 KB". */
	meta: (parts: readonly string[]) => string;
	/** The status word for an attachment not yet sent. */
	notSent: string;
	/** The status word while uploading. */
	uploading: string;
	/** The status word for a failed upload, read before the app's message. */
	uploadFailed: string;
	/** The one-stop label's non-empty parts joined: "Photo, beach.jpg, 2.4 megabytes, uploading". */
	summary: (parts: readonly string[]) => string;
	/** The remove control's name, "Remove report.pdf". */
	remove: (name: string) => string;
	/** The remove control's name while uploading. */
	cancelUpload: string;
	/** The retry control's and the retry action's name. */
	retryUpload: string;
	/** Spoken on iOS when an upload fails: "Upload failed, report.pdf, Network lost". */
	uploadFailedAnnouncement: (name: string, message: string) => string;
	/** A grouped attachment's hint, one-based: "2 of 5". */
	position: (current: number, count: number) => string;
	/** The group's accessible name. */
	group: string;
};

/** Avatar's visible and spoken strings. */
export type AvatarLabels = {
	/** A pressable avatar's name when it has no label, name or fallback text. */
	button: string;
	/** The overflow tile's spoken name, with the real count: "37 more". */
	overflow: (count: number) => string;
	/** The overflow tile's visible text; `max` is the most it draws before capping: "+37", "99+". */
	overflowText: (count: number, max: number) => string;
};

/** Badge's spoken strings. */
export type BadgeLabels = {
	/** The dismiss control's accessible name, and the root's remove action when it folds the control in. */
	remove: string;
};

/** BottomSheet's spoken strings. The skin hands them to the engine's parts. */
export type BottomSheetLabels = {
	/** `BottomSheet.Close`'s accessible name. */
	close: string;
	/** The pressable scrim's accessible name. */
	overlay: string;
	/** The grabber's accessible name — the sheet's one adjustable element. */
	handle: string;
	/** The grabber's spoken value while the sheet is closed. */
	closed: string;
	/** The grabber's spoken value at a snap point, "Snap point 2 of 3". One-based. */
	snapPoint: (position: number, count: number) => string;
};

/** Breadcrumb's spoken strings. */
export type BreadcrumbLabels = {
	/** The trail's accessible name. */
	list: string;
	/**
	 * The ellipsis' accessible name. A button offers to show the levels; a static mark only says
	 * they are there. With no count it names no number.
	 */
	ellipsis: (hiddenCount: number | undefined, isInteractive: boolean) => string;
	/** The current page's spoken value, read after its title. */
	currentPage: string;
};

/** Calendar's visible and spoken strings. */
export type CalendarLabels = {
	/** The back arrow's accessible name in the month grid. */
	previousMonth: string;
	/** The forward arrow's accessible name in the month grid. */
	nextMonth: string;
	/** The back arrow's accessible name in the months view. */
	previousYear: string;
	/** The forward arrow's accessible name in the months view. */
	nextYear: string;
	/** The caption's decrement action. */
	previous: string;
	/** The caption's increment action. */
	next: string;
	/** The caption button's hint in the month grid. */
	openMonths: string;
	/** The caption button's hint in the months view. */
	openYears: string;
	/** The caption button's hint in the years view. */
	returnToMonth: string;
	/** The years view's caption, both years already formatted: "2020 – 2031". */
	yearSpan: (from: string, to: string) => string;
	/** The caption's spoken name inside a `Field`: "Date of birth, October 2026". */
	caption: (fieldLabel: string, caption: string) => string;
	/** A day's state word. */
	today: string;
	/** A day's state word. */
	rangeStart: string;
	/** A day's state word. */
	rangeEnd: string;
	/** A day's spoken name: the full date, then its state words. */
	day: (date: string, states: readonly string[]) => string;
	/** A range with no end yet, its start already formatted: "5 Oct 2026 –". */
	openRange: (start: string) => string;
	/** A range where `Intl` has no `formatRange`, both ends already formatted. */
	range: (start: string, end: string) => string;
};

/** Carousel's spoken strings. */
export type CarouselLabels = {
	previous: string;
	next: string;
	/** The adjustable root's value, "2 of 5". One-based. */
	position: (current: number, count: number) => string;
};

/** Chart's and PieChart's spoken and visible strings. The pie's keys start with `pie`. */
export type ChartLabels = {
	/** The whole summary when there are no rows. */
	noData: string;
	/** The x range, both ends already formatted: "Jan to Jun". */
	range: (from: string, to: string) => string;
	/** The summary: the range, then each series' sentence. */
	summary: (range: string, series: readonly string[]) => string;
	/** A series with no finite value. */
	seriesNoData: (series: string) => string;
	/** A series' lowest, highest and latest values, already formatted. */
	seriesSummary: (series: string, lowest: string, highest: string, latest: string) => string;
	/** One readout row, its value already formatted: "Desktop 186". */
	readoutRow: (series: string, value: string) => string;
	/** Stands in for a readout row's missing value. */
	noValue: string;
	/** The readout under the cursor, its rows already composed: "Jan: Desktop 186, Mobile 80". */
	readout: (heading: string, rows: readonly string[]) => string;
	/** A candlestick's field name, in the tooltip and the readout. */
	open: string;
	/** A candlestick's field name. */
	high: string;
	/** A candlestick's field name. */
	low: string;
	/** A candlestick's field name. */
	close: string;
	/** A pie's whole summary when there are no slices or no total. */
	pieNoData: string;
	/** A pie's summary, each slice already composed. */
	pieSummary: (slices: readonly string[]) => string;
	/** One slice inside a pie's summary, its share already formatted: "Direct 42%". */
	pieSummarySlice: (slice: string, percent: string) => string;
	/** A slice button's name, its value and share already formatted. */
	pieSlice: (slice: string, value: string, percent: string) => string;
	/** A share as a whole number of percent, already rounded: "42%". */
	piePercent: (percent: number) => string;
};

/** Chip's spoken strings. */
export type ChipLabels = {
	/** The remove control's accessible name, and the `remove` action's label on a pressable chip. */
	remove: string;
};

/** A range of hues ColorPicker names aloud. */
export type ColorPickerHueName =
	| "red"
	| "orange"
	| "yellow"
	| "green"
	| "cyan"
	| "blue"
	| "purple"
	| "magenta"
	| "pink";

/** ColorPicker's spoken strings. */
export type ColorPickerLabels = {
	/** The area's part name. */
	area: string;
	/** The hue track's part name. */
	hue: string;
	/** The alpha track's part name. */
	opacity: string;
	/** The hex field's part name. */
	hexInput: string;
	/** A part's name inside a `Field`, "Accent, hue". The part arrives as written above. */
	partInField: (fieldLabel: string, part: string) => string;
	/** The area's action that raises brightness. */
	brighter: string;
	/** The area's action that lowers brightness. */
	darker: string;
	/** The area's value, both in whole percent: "Saturation 60 percent, brightness 80 percent". */
	areaValue: (saturation: number, brightness: number) => string;
	/** The hue track's value, degrees 0–359 with the hue's name: "Hue 210 degrees, blue". */
	hueValue: (degrees: number, hueName: string) => string;
	/** A plain name for a range of hues, read after the degrees. */
	hueName: (hue: ColorPickerHueName) => string;
	/** The alpha track's value, in whole percent: "Opacity 50 percent". */
	opacityValue: (percent: number) => string;
	/** What the trigger calls the colour outside a `Field`. */
	colour: string;
	/** The trigger row's name: "Accent, #f59e0b, opens picker". */
	trigger: (name: string, hex: string) => string;
};

/** Combobox's visible and spoken strings. */
export type ComboboxLabels = {
	/** The create row's visible text: "Use “Atlantis”". */
	create: (query: string) => string;
	/** The create row's accessible name: "Add Atlantis". */
	createAccessibility: (query: string) => string;
	/** What an empty list says, and what a screen reader hears. */
	empty: string;
	/** The search field's placeholder, and its accessible name outside a `Field`. */
	search: string;
	/** The search field's name inside a `Field`: "Country, Search". */
	searchInField: (fieldLabel: string, search: string) => string;
	/** The search field's clear button. */
	clearSearch: string;
	/** The trigger's clear button. */
	clear: string;
	/** The trigger's hint while it can open. */
	triggerHint: string;
	/** The result count, shown and announced after a filter: "3 results". */
	results: (count: number) => string;
	/** The multiple trigger's value: "3 selected". */
	selected: (count: number) => string;
	/** A row that `maxSelected` disabled, with no description of its own. */
	limitReached: string;
	/** Multiple mode's footer button. */
	done: string;
	/** A chip's remove button: "Remove Fiji". */
	removeChip: (label: string) => string;
	/** The overflow chip's accessible name: "2 more". */
	moreChips: (count: number) => string;
	/** The overflow chip's visible text: "+2". */
	moreChipsShort: (count: number) => string;
};

/** Compare's spoken strings. */
export type CompareLabels = {
	/** Before's name when no `Compare.Label` gives one. */
	before: string;
	/** After's name when no `Compare.Label` gives one. */
	after: string;
	/** The handle's value at either end, naming the one layer on show: "Showing only after". */
	showingOnly: (side: string) => string;
	/** The handle's value between the ends, Before's share in whole percent: "50 percent before". */
	share: (percent: number, before: string) => string;
};

/** ContextMenu's spoken strings. */
export type ContextMenuLabels = {
	/** The trigger's long-press action, which opens the menu. */
	show: string;
};

/** Countdown's visible and spoken strings. */
export type CountdownLabels = {
	/** The days box's caption. Set on the component's own `labels` alone, it also names the unit aloud. */
	days: string;
	/** The hours box's caption. Set on the component's own `labels` alone, it also names the unit aloud. */
	hours: string;
	/** The minutes box's caption. Set on the component's own `labels` alone, it also names the unit aloud. */
	minutes: string;
	/** The seconds box's caption. Set on the component's own `labels` alone, it also names the unit aloud. */
	seconds: string;
	/** A spoken number of days, "2 days". */
	dayCount: (count: number) => string;
	/** A spoken number of hours, "1 hour". */
	hourCount: (count: number) => string;
	/** A spoken number of minutes, "5 minutes". */
	minuteCount: (count: number) => string;
	/** A spoken number of seconds, "30 seconds". */
	secondCount: (count: number) => string;
	/** Spoken once time is up, and announced at expiry. */
	timeUp: string;
	/** The spoken label from the non-zero amounts, largest first: "2 days, 3 hours left". */
	remaining: (amounts: readonly string[]) => string;
	/** The days lead of the inline run, "2d". */
	inlineDays: (days: number) => string;
};

/** DatePicker's visible and spoken strings. */
export type DatePickerLabels = {
	/** The sheet's title. */
	title: string;
	/** Done's label. */
	done: string;
	/** Clear's label. */
	clear: string;
	/** The trigger's accessible name when neither the caller nor a `Field.Label` names it. */
	trigger: string;
	/** The trigger's hint while it can open. */
	triggerHint: string;
	/** The empty trigger's text for a single day. */
	placeholder: string;
	/** The empty trigger's text for a range. */
	rangePlaceholder: string;
	/** The empty trigger's text for several days. */
	multiplePlaceholder: string;
	/** Muted after a half-picked range's start, in place of its end. */
	rangeEnd: string;
	/** Several days, counted instead of listed, both shown and spoken: "5 dates". */
	dateCount: (count: number) => string;
	/** A short list of days, already formatted, both shown and spoken. */
	dateList: (dates: readonly string[]) => string;
	/** The spoken value while nothing is picked. */
	notSet: string;
	/** A half-picked range, spoken, its start already formatted. */
	rangeStarted: (start: string) => string;
	/** A whole range, spoken, both ends already formatted. */
	range: (start: string, end: string) => string;
	/** Announced when a pick closes the sheet, with the spoken value. */
	selected: (value: string) => string;
};

/** DateTimePicker's visible and spoken strings. */
export type DateTimePickerLabels = {
	/** The sheet's title. */
	title: string;
	/** Done's label. */
	done: string;
	/** Clear's label. */
	clear: string;
	/** The Date tab's label. */
	date: string;
	/** The Time tab's label, and the time row's. */
	time: string;
	/** The trigger's accessible name when neither the caller nor a `Field.Label` names it. */
	trigger: string;
	/** The trigger's hint. */
	triggerHint: string;
	/** The trigger's text while nothing is set. */
	placeholder: string;
	/** The time row's readout while nothing is set. */
	emptyTime: string;
	/** The spoken value while nothing is set. */
	notSet: string;
	/** The tabs time row's accessible name, from its label and spoken value. */
	timeRow: (label: string, value: string) => string;
	/** The stacked time row's hint: what a press does to the wheel. */
	timeWheelHint: (isExpanded: boolean) => string;
	/** A whole value, spoken, date and time already formatted: "Monday 5 October 2026 at 3:30 PM". */
	dateTime: (date: string, time: string) => string;
	/** Announced on Done, with the spoken value. */
	selected: (value: string) => string;
	/** Announced on Done with nothing set. */
	noneSelected: string;
};

/** Dialog's spoken strings. */
export type DialogLabels = {
	/** The corner close glyph's accessible name. */
	close: string;
};

/** Drawer's spoken strings. */
export type DrawerLabels = {
	/** The header's ✕ and a bare `Drawer.Close`: its accessible name. An `accessibilityLabel` prop wins. */
	close: string;
};

/** Fab's spoken strings. */
export type FabLabels = {
	/** The scrim behind an open `Fab.Group`, a full-screen button that closes it. */
	close: string;
};

/** Feedback's visible and spoken strings. */
export type FeedbackLabels = {
	/** `Feedback.Submit`'s text when it has no children. */
	submit: string;
	/** `Feedback.Cancel`'s text when it has no children. */
	cancel: string;
	/** Announced when a promise `onSubmit` resolves. `Feedback.Submit`'s `sentMessage` wins. */
	sent: string;
	/** Announced, assertively, when a promise `onSubmit` rejects. `Feedback.Submit`'s `failedMessage` wins. */
	failed: string;
};

/** FlipCard's spoken strings. */
export type FlipCardLabels = {
	/** The turn's accessible name: the flip button, a swipe card's `activate` action, an icon-only `FlipCard.Trigger`. */
	action: string;
	/** Announced once the card settles on its front. The root's `faceLabels` wins. */
	front: string;
	/** Announced once the card settles on its back. The root's `faceLabels` wins. */
	back: string;
	/** The flip control's hint while the front shows. */
	showsBack: string;
	/** The flip control's hint while the back shows. */
	showsFront: string;
};

/** Flow's spoken strings. */
export type FlowLabels = {
	/** The zoom-in control's accessible name. */
	zoomIn: string;
	/** The zoom-out control's accessible name. */
	zoomOut: string;
	/** The fit-to-view control's accessible name. */
	fit: string;
	/** The lock toggle's accessible name. It reports its state as selected. */
	lock: string;
	/** A node's assistive action that activates it, offered when it has an `onPress`. */
	select: string;
	/** A draggable node's assistive move up. */
	moveUp: string;
	/** A draggable node's assistive move down. */
	moveDown: string;
	/** A draggable node's assistive move left. */
	moveLeft: string;
	/** A draggable node's assistive move right. */
	moveRight: string;
	/** A node's assistive action that deletes it, offered when it has an `onDelete`. */
	delete: string;
	/**
	 * One connect action: this node's handle (`from`, null when unnamed) to another node (`target`)
	 * and its handle (`into`, null when unnamed or the only one): "Connect out to Merge, first input".
	 */
	connect: (from: string | null, target: string, into: string | null) => string;
};

/** ImageViewer's visible and spoken strings. */
export type ImageViewerLabels = {
	/** The Trigger's accessible hint, read after its alt text. Its `accessibilityHint` wins. */
	open: string;
	/** The close button's accessible name. Its `accessibilityLabel` wins. */
	close: string;
	/** The pager's `increment` action. */
	nextImage: string;
	/** The pager's `decrement` action. */
	previousImage: string;
	/** The pager's `zoomIn` action. */
	zoomIn: string;
	/** The pager's `zoomOut` action. */
	zoomOut: string;
	/** The pager's `resetZoom` action. */
	resetZoom: string;
	/** The pager's spoken value, "2 of 5". One-based. */
	position: (current: number, count: number) => string;
	/** The chrome's visible counter, "2 / 5". One-based; shown for a gallery of more than one. */
	counter: (current: number, count: number) => string;
	/** Visible where an image failed to load and nothing sits beneath it. */
	loadFailed: string;
};

/** Kpi's spoken strings. */
export type KpiLabels = {
	up: string;
	down: string;
	/** Read alone, in place of a direction and an amount. */
	flat: string;
	/** A trend's amount, already formatted to one decimal place: "7.8 percent". */
	percent: (magnitude: string) => string;
	/** A sparkline's name, with its first and last values already formatted. */
	sparkline: (points: number, first: string, last: string) => string;
	/** A sparkline with no finite value to read. */
	noTrendData: string;
	/** The value's placeholder while it loads. */
	loading: string;
};

/** Leaderboard's visible and spoken strings. */
export type LeaderboardLabels = {
	/** Shown when `data` is empty. The root's `emptyText` wins. */
	empty: string;
	/** A place's rank, first in its spoken sentence: "Rank 2". */
	rank: (rank: number) => string;
	/** Said after the rank when the place shares its value with another entry. */
	tied: string;
	/** A climb or a fall: "up 3 places", "down 1 place". */
	moved: (direction: "up" | "down", places: number) => string;
	/** An entry whose `change` is zero. */
	noChange: string;
};

/** Map's spoken strings: the map's name and `Map.Controls`' button names. */
export type MapLabels = {
	/** The native map's accessible name. The root's `accessibilityLabel` wins. */
	name: string;
	/** The zoom-in button's accessible name. */
	zoomIn: string;
	/** The zoom-out button's accessible name. */
	zoomOut: string;
	/** The compass button's accessible name; it turns the map back to north-up. */
	pointNorth: string;
	/** The recenter button's accessible name; it returns to the opening view. */
	recenter: string;
	/** The locate button's accessible name; it flies to the device's location. */
	showMyLocation: string;
};

/** Every MarkdownEditor toolbar action. Restates `MarkdownToolbarAction`: the catalog imports nothing. */
export type MarkdownEditorActionKey =
	| "heading"
	| "bold"
	| "italic"
	| "strikethrough"
	| "code"
	| "codeBlock"
	| "link"
	| "quote"
	| "bulletList"
	| "orderedList";

/** MarkdownEditor's visible and spoken strings. */
export type MarkdownEditorLabels = {
	/** Each toolbar button's accessible name, and the subject of its announcement. */
	actions: Record<MarkdownEditorActionKey, string>;
	/** Announced after a toolbar press switches a format on; `name` is the action's name. */
	applied: (name: string) => string;
	/** Announced after a toolbar press switches a format off. */
	removed: (name: string) => string;
	/** The mode switch's Write tab. */
	write: string;
	/** The mode switch's Preview tab. */
	preview: string;
	/** The preview pane's accessible name. */
	previewPane: string;
	/** `MarkdownEditor.Preview`'s text when there is nothing to render. Its `emptyText` wins. */
	empty: string;
	/** A bullet-list row's spoken text; an ordered row speaks its number instead. */
	bulletItem: (text: string) => string;
	/** The text a link command inserts, selected, when nothing was selected. */
	linkText: string;
};

/** Menu's spoken strings. ContextMenu's panel is `Menu.Content`, so it speaks `close` too. */
export type MenuLabels = {
	/** The accessible name of the dismiss target behind an open panel. */
	close: string;
	/** `Menu.Trigger`'s hint, read after its name. Its `accessibilityHint` wins. */
	triggerHint: string;
};

/** The receipts a message moves through. Restates `MessageStatusType`: the catalog imports nothing. */
export type MessageStatusKey = "sending" | "sent" | "delivered" | "read" | "failed";

/** Message's visible and spoken strings. */
export type MessageLabels = {
	/**
	 * A receipt's words, drawn under the bubble, spoken in the message's label and announced when a
	 * send fails. `reason` is the app's own text, trimmed, and only ever present for "failed".
	 */
	status: (type: MessageStatusKey, reason?: string) => string;
	/** Stands in for an outgoing message's author. */
	you: string;
	/** A typing indicator with no author to name. */
	typing: string;
	/** A typing indicator for an incoming author: "Aria is typing". */
	typingBy: (author: string) => string;
	/** The named action that mirrors a long press. */
	moreActions: string;
	/** The failed receipt's Retry control, drawn and as an action. */
	retry: string;
};

/** What a looping animation's pause control is called — every looping component shares them. */
export type MotionLabels = {
	/** Offered while the loop moves. */
	pause: string;
	/** Offered while the user holds it paused. */
	resume: string;
};

/** Pagination's visible and spoken strings. */
export type PaginationLabels = {
	/** The control's accessible name. */
	list: string;
	/** Visible beside the chevron. */
	previous: string;
	/** Visible beside the chevron. */
	next: string;
	/** The previous arrow's accessible name. */
	previousPage: string;
	/** The next arrow's accessible name. */
	nextPage: string;
	/** A page item's accessible name, "Page 3". */
	page: (page: number) => string;
	/** The compact readout as a screen reader hears it, "Page 3 of 12". */
	pageOf: (page: number, count: number) => string;
	/** A gap's accessible name, "Jump forward 5 pages". */
	jump: (direction: -1 | 1, pages: number) => string;
	/** The visible status line, "41–60 of 472". */
	status: (range: { from: number; to: number; total: number }) => string;
};

/** Every component's labels, as the library ships them. */
export type DelacourLabels = {
	alert: AlertLabels;
	attachment: AttachmentLabels;
	avatar: AvatarLabels;
	badge: BadgeLabels;
	bottomSheet: BottomSheetLabels;
	breadcrumb: BreadcrumbLabels;
	calendar: CalendarLabels;
	carousel: CarouselLabels;
	chart: ChartLabels;
	chip: ChipLabels;
	colorPicker: ColorPickerLabels;
	combobox: ComboboxLabels;
	compare: CompareLabels;
	contextMenu: ContextMenuLabels;
	countdown: CountdownLabels;
	datePicker: DatePickerLabels;
	dateTimePicker: DateTimePickerLabels;
	dialog: DialogLabels;
	drawer: DrawerLabels;
	fab: FabLabels;
	feedback: FeedbackLabels;
	flipCard: FlipCardLabels;
	flow: FlowLabels;
	imageViewer: ImageViewerLabels;
	kpi: KpiLabels;
	leaderboard: LeaderboardLabels;
	map: MapLabels;
	markdownEditor: MarkdownEditorLabels;
	menu: MenuLabels;
	message: MessageLabels;
	motion: MotionLabels;
	pagination: PaginationLabels;
};

/** A component whose strings the catalog holds. */
export type DelacourLabelsComponent = keyof DelacourLabels;

/** Some of each component's labels — what `DelacourProvider`'s `labels` prop takes. */
export type DelacourLabelOverrides = { [K in DelacourLabelsComponent]?: Partial<DelacourLabels[K]> };

const plural = (count: number, one: string, other: string): string => (count === 1 ? one : other);

/** Today's English. */
export const DELACOUR_DEFAULT_LABELS: DelacourLabels = {
	alert: {
		dismiss: "Dismiss",
		announcement: (title, description) =>
			/[.!?…:]$/.test(title) ? `${title} ${description}` : `${title}. ${description}`,
	},
	attachment: {
		kind: (kind) => ({ image: "Photo", video: "Video", audio: "Audio", file: "File" })[kind],
		fileSize: (formatted, unit) =>
			`${formatted} ${{ byte: "B", kilobyte: "KB", megabyte: "MB", gigabyte: "GB", terabyte: "TB" }[unit]}`,
		spokenFileSize: (amount, formatted, unit) => `${formatted} ${plural(amount, unit, `${unit}s`)}`,
		spokenDuration: ({ hours, minutes, seconds }) => {
			const parts: string[] = [];
			if (hours > 0) parts.push(`${hours} ${plural(hours, "hour", "hours")}`);
			if (minutes > 0) parts.push(`${minutes} ${plural(minutes, "minute", "minutes")}`);
			if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${plural(seconds, "second", "seconds")}`);
			return parts.join(" ");
		},
		meta: (parts) => parts.join(" · "),
		notSent: "not sent",
		uploading: "uploading",
		uploadFailed: "upload failed",
		summary: (parts) => parts.join(", "),
		remove: (name) => `Remove ${name}`,
		cancelUpload: "Cancel upload",
		retryUpload: "Retry upload",
		uploadFailedAnnouncement: (name, message) => `Upload failed, ${name}, ${message}`,
		position: (current, count) => `${current} of ${count}`,
		group: "Attachments",
	},
	avatar: {
		button: "Avatar",
		overflow: (count) => `${count} more`,
		overflowText: (count, max) => (count > max ? `${max}+` : `+${count}`),
	},
	badge: {
		remove: "Remove",
	},
	bottomSheet: {
		close: "Close",
		overlay: "Close",
		handle: "Bottom sheet",
		closed: "Closed",
		snapPoint: (position, count) => `Snap point ${position} of ${count}`,
	},
	breadcrumb: {
		list: "Breadcrumb",
		ellipsis: (hiddenCount, isInteractive) => {
			if (hiddenCount === undefined) return isInteractive ? "Show hidden levels" : "Hidden levels";
			const counted = `${hiddenCount} hidden ${plural(hiddenCount, "level", "levels")}`;
			return isInteractive ? `Show ${counted}` : counted;
		},
		currentPage: "current page",
	},
	calendar: {
		previousMonth: "Previous month",
		nextMonth: "Next month",
		previousYear: "Previous year",
		nextYear: "Next year",
		previous: "Previous",
		next: "Next",
		openMonths: "Opens the month and year picker",
		openYears: "Opens the year list",
		returnToMonth: "Returns to the month",
		yearSpan: (from, to) => `${from} – ${to}`,
		caption: (fieldLabel, caption) => `${fieldLabel}, ${caption}`,
		today: "Today",
		rangeStart: "Range start",
		rangeEnd: "Range end",
		day: (date, states) => [date, ...states].join(", "),
		openRange: (start) => `${start} –`,
		range: (start, end) => `${start} – ${end}`,
	},
	carousel: {
		previous: "Previous slide",
		next: "Next slide",
		position: (current, count) => `${current} of ${count}`,
	},
	chart: {
		noData: "Chart, no data.",
		range: (from, to) => `${from} to ${to}`,
		summary: (range, series) => [`Chart, ${range}.`, ...series].join(" "),
		seriesNoData: (series) => `${series}: no data.`,
		seriesSummary: (series, lowest, highest, latest) =>
			`${series}: lowest ${lowest}, highest ${highest}, latest ${latest}.`,
		readoutRow: (series, value) => `${series} ${value}`,
		noValue: "no value",
		readout: (heading, rows) => (heading === "" ? rows.join(", ") : `${heading}: ${rows.join(", ")}`),
		open: "Open",
		high: "High",
		low: "Low",
		close: "Close",
		pieNoData: "Pie chart, no data.",
		pieSummary: (slices) => `Pie chart. ${slices.join(", ")}.`,
		pieSummarySlice: (slice, percent) => `${slice} ${percent}`,
		pieSlice: (slice, value, percent) => `${slice}, ${value}, ${percent}`,
		piePercent: (percent) => `${percent}%`,
	},
	chip: {
		remove: "Remove",
	},
	colorPicker: {
		area: "Saturation and brightness",
		hue: "Hue",
		opacity: "Opacity",
		hexInput: "Hex colour",
		partInField: (fieldLabel, part) => `${fieldLabel}, ${part.charAt(0).toLowerCase()}${part.slice(1)}`,
		brighter: "Brighter",
		darker: "Darker",
		areaValue: (saturation, brightness) => `Saturation ${saturation} percent, brightness ${brightness} percent`,
		hueValue: (degrees, hueName) => `Hue ${degrees} degrees, ${hueName}`,
		hueName: (hue) => hue,
		opacityValue: (percent) => `Opacity ${percent} percent`,
		colour: "Colour",
		trigger: (name, hex) => `${name}, ${hex}, opens picker`,
	},
	combobox: {
		create: (query) => `Use “${query}”`,
		createAccessibility: (query) => `Add ${query}`,
		empty: "No results",
		search: "Search",
		searchInField: (fieldLabel, search) => `${fieldLabel}, ${search}`,
		clearSearch: "Clear search",
		clear: "Clear",
		triggerHint: "Opens a searchable list of options",
		results: (count) => `${count} ${plural(count, "result", "results")}`,
		selected: (count) => `${count} selected`,
		limitReached: "Limit reached",
		done: "Done",
		removeChip: (label) => `Remove ${label}`,
		moreChips: (count) => `${count} more`,
		moreChipsShort: (count) => `+${count}`,
	},
	compare: {
		before: "before",
		after: "after",
		showingOnly: (side) => `Showing only ${side}`,
		share: (percent, before) => `${percent} percent ${before}`,
	},
	contextMenu: {
		show: "Show menu",
	},
	countdown: {
		days: "Days",
		hours: "Hours",
		minutes: "Minutes",
		seconds: "Seconds",
		dayCount: (count) => `${count} ${plural(count, "day", "days")}`,
		hourCount: (count) => `${count} ${plural(count, "hour", "hours")}`,
		minuteCount: (count) => `${count} ${plural(count, "minute", "minutes")}`,
		secondCount: (count) => `${count} ${plural(count, "second", "seconds")}`,
		timeUp: "Time is up",
		remaining: (amounts) => `${amounts.join(", ")} left`,
		inlineDays: (days) => `${days}d`,
	},
	datePicker: {
		title: "Select date",
		done: "Done",
		clear: "Clear",
		trigger: "Date",
		triggerHint: "Opens calendar",
		placeholder: "Select date",
		rangePlaceholder: "Start – End",
		multiplePlaceholder: "Select dates",
		rangeEnd: "End",
		dateCount: (count) => `${count} ${plural(count, "date", "dates")}`,
		dateList: (dates) => dates.join(", "),
		notSet: "not set",
		rangeStarted: (start) => `From ${start}, no end chosen`,
		range: (start, end) => `${start} to ${end}`,
		selected: (value) => `Selected ${value}`,
	},
	dateTimePicker: {
		title: "Select date and time",
		done: "Done",
		clear: "Clear",
		date: "Date",
		time: "Time",
		trigger: "Date and time",
		triggerHint: "Opens date and time picker",
		placeholder: "Select date and time",
		emptyTime: "–",
		notSet: "not set",
		timeRow: (label, value) => `${label}, ${value}`,
		timeWheelHint: (isExpanded) => (isExpanded ? "Hides the time wheel" : "Shows the time wheel"),
		dateTime: (date, time) => `${date} at ${time}`,
		selected: (value) => `Selected ${value}`,
		noneSelected: "No date and time selected",
	},
	dialog: {
		close: "Close",
	},
	drawer: {
		close: "Close",
	},
	fab: {
		close: "Close",
	},
	feedback: {
		submit: "Send",
		cancel: "Cancel",
		sent: "Feedback sent",
		failed: "Couldn't send feedback",
	},
	flipCard: {
		action: "Flip card",
		front: "Front of card",
		back: "Back of card",
		showsBack: "Shows the back",
		showsFront: "Shows the front",
	},
	flow: {
		zoomIn: "Zoom in",
		zoomOut: "Zoom out",
		fit: "Fit to view",
		lock: "Lock canvas",
		select: "Select",
		moveUp: "Move up",
		moveDown: "Move down",
		moveLeft: "Move left",
		moveRight: "Move right",
		delete: "Delete",
		connect: (from, target, into) => `Connect${from ? ` ${from}` : ""} to ${target}${into ? `, ${into}` : ""}`,
	},
	imageViewer: {
		open: "Opens full screen image viewer",
		close: "Close image viewer",
		nextImage: "Next image",
		previousImage: "Previous image",
		zoomIn: "Zoom in",
		zoomOut: "Zoom out",
		resetZoom: "Reset zoom",
		position: (current, count) => `${current} of ${count}`,
		counter: (current, count) => `${current} / ${count}`,
		loadFailed: "This image could not be loaded",
	},
	kpi: {
		up: "Up",
		down: "Down",
		flat: "No change",
		percent: (magnitude) => `${magnitude} percent`,
		sparkline: (points, first, last) => `Trend over ${points} points, from ${first} to ${last}`,
		noTrendData: "No trend data",
		loading: "Loading",
	},
	leaderboard: {
		empty: "No entries yet",
		rank: (rank) => `Rank ${rank}`,
		tied: "tied",
		moved: (direction, places) => `${direction} ${places} ${plural(places, "place", "places")}`,
		noChange: "no change",
	},
	map: {
		name: "Map",
		zoomIn: "Zoom in",
		zoomOut: "Zoom out",
		pointNorth: "Point north",
		recenter: "Recenter map",
		showMyLocation: "Show my location",
	},
	markdownEditor: {
		actions: {
			bold: "Bold",
			bulletList: "Bulleted list",
			code: "Inline code",
			codeBlock: "Code block",
			heading: "Heading",
			italic: "Italic",
			link: "Link",
			orderedList: "Numbered list",
			quote: "Quote",
			strikethrough: "Strikethrough",
		},
		applied: (name) => `${name} applied`,
		removed: (name) => `${name} removed`,
		write: "Write",
		preview: "Preview",
		previewPane: "Preview",
		empty: "Nothing to preview",
		bulletItem: (text) => `bullet ${text}`,
		linkText: "link",
	},
	menu: {
		close: "Close menu",
		triggerHint: "Opens a menu",
	},
	message: {
		status: (type, reason) => {
			switch (type) {
				case "sending":
					return "Sending";
				case "sent":
					return "Sent";
				case "delivered":
					return "Delivered";
				case "read":
					return "Read";
				case "failed":
					return reason ? `Failed: ${reason}` : "Failed to send";
			}
		},
		you: "You",
		typing: "Typing",
		typingBy: (author) => `${author} is typing`,
		moreActions: "More actions",
		retry: "Retry",
	},
	motion: {
		pause: "Pause animation",
		resume: "Resume animation",
	},
	pagination: {
		list: "Pagination",
		previous: "Previous",
		next: "Next",
		previousPage: "Previous page",
		nextPage: "Next page",
		page: (page) => `Page ${page}`,
		pageOf: (page, count) => `Page ${page} of ${count}`,
		jump: (direction, pages) =>
			`Jump ${direction === 1 ? "forward" : "back"} ${pages} ${plural(pages, "page", "pages")}`,
		status: ({ from, to, total }) => `${from}–${to} of ${total}`,
	},
};

/** `base` with every key `override` defines laid over it; an `undefined` in `override` is skipped. */
function overlay<T extends object>(base: T, override: Partial<T> | undefined): T {
	if (override === undefined) return base;
	const merged: T = { ...base };
	for (const key of Object.keys(override) as (keyof T)[]) {
		const value = override[key];
		if (value !== undefined) merged[key] = value as T[keyof T];
	}
	return merged;
}

/**
 * One component's labels: the defaults, then the provider's overrides, then the component's own.
 * Pure; the defaults are never mutated.
 */
export function resolveLabels<K extends DelacourLabelsComponent>(
	component: K,
	provider: DelacourLabelOverrides | undefined,
	own: Partial<DelacourLabels[K]> | undefined
): DelacourLabels[K] {
	const fromProvider = provider?.[component] as Partial<DelacourLabels[K]> | undefined;
	return overlay(overlay(DELACOUR_DEFAULT_LABELS[component], fromProvider), own);
}

/**
 * Whether two label overrides hold the same keys with the same values, compared with `Object.is`.
 * A function label compares by identity, so an inline arrow is a new value every time.
 */
export function areLabelsShallowEqual(a: object | undefined, b: object | undefined): boolean {
	if (a === b) return true;
	if (a === undefined || b === undefined) return false;
	const aKeys = Object.keys(a);
	if (aKeys.length !== Object.keys(b).length) return false;
	const aRecord = a as Record<string, unknown>;
	const bRecord = b as Record<string, unknown>;
	return aKeys.every((key) => Object.hasOwn(b, key) && Object.is(aRecord[key], bRecord[key]));
}

/** A nested provider's overrides over its parent's, merged per component and per key. */
export function mergeLabelOverrides(
	outer: DelacourLabelOverrides,
	inner: DelacourLabelOverrides | undefined
): DelacourLabelOverrides {
	if (inner === undefined) return outer;
	const merged: Record<string, object> = { ...outer };
	for (const component of Object.keys(inner) as DelacourLabelsComponent[]) {
		const own = inner[component];
		if (own === undefined) continue;
		merged[component] = overlay<object>(outer[component] ?? {}, own);
	}
	return merged as DelacourLabelOverrides;
}
