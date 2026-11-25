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
	/**
	 * The dismiss control's name when the badge has a label, so a row of dismissible badges is not
	 * a row of identical "Remove" stops. Optional: without it the name is `remove` and the label,
	 * "Remove Beta", so a localised `remove` keeps its verb. Set it where that word order is wrong.
	 */
	removeNamed?: (label: string) => string;
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
	/**
	 * Unused: the create row is named by its visible text (`create`), so the spoken name contains
	 * what is shown (WCAG 2.5.3, label in name). Kept so an existing override still type-checks.
	 *
	 * @deprecated Override `create` instead.
	 */
	createAccessibility: (query: string) => string;
	/** What an empty list says, and what a screen reader hears. */
	empty: string;
	/** The search field's placeholder, and its accessible name outside a `Field`. */
	search: string;
	/** The search field's name inside a `Field`: "Country, Search". */
	searchInField: (fieldLabel: string, search: string) => string;
	/**
	 * The trigger's name inside a `Field` while it shows its placeholder: "Country, Choose a country".
	 * The placeholder is the visible text, so the name has to contain it (WCAG 2.5.3).
	 */
	triggerInField: (fieldLabel: string, placeholder: string) => string;
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

/**
 * MarkdownEditor's visible and spoken strings. Each toolbar action is a key of its own — its button's
 * accessible name and the subject of its announcement — so renaming one leaves the rest alone.
 */
export type MarkdownEditorLabels = { [Action in MarkdownEditorActionKey]: string } & {
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
	/** A link inside a list row, offered as an action on the row; `text` is the link's text. */
	openLink: (text: string) => string;
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

/** MessageScroller's visible and spoken strings. */
export type MessageScrollerLabels = {
	/** The list's accessible name. */
	list: string;
	/** The jump button's accessible name before any unread count. Its `label` wins. */
	jumpToLatest: string;
	/** The jump button's name with an unread count, already capped: "Jump to latest, 3 unread". */
	jumpToLatestUnread: (base: string, count: string) => string;
	/** Spoken while an older page loads. `LoadingOlder`'s `label` wins. */
	loadingOlder: string;
	/** The day separator for the current day. */
	today: string;
	/** The day separator for the day before. */
	yesterday: string;
	/** A weekday's full name, 0 = Sunday, for a day inside the last six. Unused when a `locale` is given. */
	weekday: (day: number) => string;
	/** A month's short name, 0 = January. Unused when a `locale` is given. */
	month: (month: number) => string;
	/** A separator for an older day, its month already named: "12 Sep", or "12 Sep 2025" outside this year. */
	date: (day: number, month: string, year?: number) => string;
	/** The unread divider's text: "1 new message", "3 new messages". `UnreadDivider`'s `label` wins. */
	unreadDivider: (count: number) => string;
	/** Announced when messages arrive away from the end; `senderName` only for a single named arrival. */
	newMessages: (count: number, senderName?: string) => string;
};

/** Planner's visible and spoken strings. Month and weekday names come from `Intl`, in the planner's `locale`. */
export type PlannerLabels = {
	/** The back button's accessible name. `Planner.Nav`'s `previousLabel` wins. */
	previousMonth: string;
	/** The forward button's accessible name. `Planner.Nav`'s `nextLabel` wins. */
	nextMonth: string;
	/** `Planner.Today`'s text when it has no children. */
	today: string;
	/** A day's entry count, inside its spoken label: "no entries", "1 entry", "3 entries". */
	entryCount: (count: number) => string;
	/**
	 * A day's whole spoken label. `date` is the localised day title, `entries` is `entryCount`'s
	 * text, `names` the day's category or entry names in order: "Wednesday, October 14, 2 entries, Run, today".
	 */
	day: (date: string, entries: string, names: readonly string[], isToday: boolean) => string;
	/** A legend row's spoken label when counts show: "Run, 4". */
	legendCount: (name: string, count: number) => string;
	/** `Planner.Summary`'s text when it has no children; `month` is the localised month: "12 entries in October". */
	summary: (count: number, month: string) => string;
	/** A `calendar` day's overflow line: "+3 more". */
	more: (count: number) => string;
};

/** What a looping animation's pause control is called — every looping component shares them. */
export type MotionLabels = {
	/** Offered while the loop moves. */
	pause: string;
	/** Offered while the user holds it paused. */
	resume: string;
};

/** NumberInput's spoken strings. */
export type NumberInputLabels = {
	/** The decrement stepper's name. `NumberInput.Decrement`'s `accessibilityLabel` wins. */
	decrease: string;
	/** The increment stepper's name. `NumberInput.Increment`'s `accessibilityLabel` wins. */
	increase: string;
	/** Announced when a step reaches a bound, `text` the formatted value: "10, maximum". */
	limit: (text: string, bound: "max" | "min") => string;
};

/** What an OtpInput cell takes, for the words around it: `digits` is "digit", any other pattern "character". */
export type OtpInputUnit = "digit" | "character";

/** OtpInput's spoken strings. */
export type OtpInputLabels = {
	/** The accessible name when neither `accessibilityLabel` nor an enclosing `Field.Label` gives one. */
	defaultLabel: string;
	/** The value while masked or empty, how many cells are filled: "2 of 4 digits entered". */
	progress: (entered: number, length: number, unit: OtpInputUnit) => string;
	/** The hint saying what to type: "Enter the 6 digit code". Its `accessibilityHint` wins. */
	hint: (length: number, unit: OtpInputUnit) => string;
};

/** PageHeader's spoken strings. */
export type PageHeaderLabels = {
	/** A verified, named avatar's label: "Aria, verified". `name` is trimmed and non-empty. */
	verifiedAvatar: (name: string) => string;
	/** A verified avatar with no name. */
	verified: string;
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

/** Popover's spoken strings. */
export type PopoverLabels = {
	/** The corner close button's accessible name. */
	close: string;
};

/** A vote, as the catalog names it. Restates `PostVote`: the catalog imports nothing. */
export type PostLabelVote = "up" | "down" | null;

/**
 * How long ago a post was made, as the catalog is handed it. Restates the buckets
 * `formatRelativeTime` computes. A `date` is past a week: `month` is zero-based (0 is January),
 * `year` is set only when it differs from the current year.
 */
export type PostTimeAgo =
	| { unit: "now" }
	| { unit: "minute" | "hour" | "day"; count: number }
	| { unit: "date"; month: number; day: number; year: number | undefined };

/** Post's visible and spoken strings. */
export type PostLabels = {
	/** The time as printed on the card: "now", "3m", "2h", "2d", "Oct 5", "Oct 5, 2024". */
	timeShort: (ago: PostTimeAgo) => string;
	/** The time as a screen reader says it: "just now", "3 minutes ago", "October 5". */
	timeSpoken: (ago: PostTimeAgo) => string;
	/**
	 * `Post.Author`'s one-stop label: name, handle, verified, time, non-empty parts only —
	 * "Aria, @aria, verified, 3 minutes ago". `handle` is as the caller wrote it; `spokenTime` is
	 * `timeSpoken`'s output, or the caller's `timestamp`, and may be empty.
	 */
	author: (parts: { name: string; handle: string | undefined; isVerified: boolean; spokenTime: string }) => string;
	/** `Post.Community`'s label when `meta` is a string, "r/reactnative, 5h ago · u/aria". `meta` is undefined when it is a node. */
	community: (name: string, meta: string | undefined) => string;
	/**
	 * `Post.Stat`'s label with a value: noun and count together, "Like, 1,234". `value` arrives
	 * grouped when it was a number. Not called with no value, or a string value the same as the
	 * label: the label alone is said then.
	 */
	stat: (label: string, value: string) => string;
	/** The vote group's label, "Score 1,240". `score` arrives grouped when it was a number. */
	score: (score: string) => string;
	/** The up arrow's accessible name. */
	upvote: string;
	/** The down arrow's accessible name. */
	downvote: string;
	/**
	 * Spoken after the caller's own vote lands, "Upvoted, score 1,241". `vote` is the state now;
	 * `null` means the vote was removed. `score` arrives grouped when it was a number.
	 */
	voteAnnouncement: (vote: PostLabelVote, score: string) => string;
	/** The body toggle's visible word while the body is clamped. */
	more: string;
	/** The body toggle's visible word while the body is open. */
	less: string;
	/** The body toggle's accessible name while clamped; contains the visible word. */
	showMore: string;
	/** The body toggle's accessible name while open. */
	showLess: string;
	/** A pressable card's screen-reader carrier name. */
	openPost: string;
	/** The carrier's `longpress` action, offered on every platform. */
	moreOptions: string;
};

/** Progress's spoken strings. */
export type ProgressLabels = {
	/**
	 * The bar's spoken value on any range but 0 to 100, "18 of 24". Both numbers arrive already
	 * formatted with the readout's `Intl.NumberFormat`, so grouping and decimals follow the locale.
	 * `valueLabel` still replaces it.
	 */
	valueOf: (current: string, max: string) => string;
};

/** ProgressButton's spoken strings. */
export type ProgressButtonLabels = {
	/** The accessibility hint read after the label: how a screen-reader user completes the hold. */
	hint: string;
	/** Spoken once when the hold completes. Pass the `Done` content's text via `completedAnnouncement` when it says more. */
	completed: string;
};

/** QRCode's spoken strings. */
export type QrCodeLabels = {
	/**
	 * The code's accessible name when the caller gives none. `shown` is the value already cut to 60
	 * characters with a trailing "…" when it was longer: "QR code: https://delacour.co.nz".
	 */
	code: (shown: string) => string;
	/** The name of a code with no value, or one that could not be encoded. */
	unavailable: string;
};

/** Questionnaire's visible and spoken strings. */
export type QuestionnaireLabels = {
	/** `Questionnaire.Back`'s text. */
	back: string;
	/** `Questionnaire.Next`'s text. */
	next: string;
	/** `Questionnaire.Submit`'s text. */
	submit: string;
	/** `Questionnaire.Skip`'s text. */
	skip: string;
	/** `Questionnaire.Skip`'s accessible name, longer than its text. */
	skipQuestion: string;
	/** Next's and Submit's hint while the current answer would not validate. */
	answerRequired: string;
	/** A yes/no question's first button, unless the question sets `yesLabel`. */
	yes: string;
	/** A yes/no question's second button, unless the question sets `noLabel`. */
	no: string;
	/** The free-text field's accessible name once an "Other" option is chosen. */
	otherAnswer: string;
	/** That field's placeholder. */
	otherPlaceholder: string;
	/** The count readout and the spoken prefix of a question. `current` is one-based: "Question 2 of 5". */
	questionCount: (current: number, total: number) => string;
	/** Spoken when the user moves to another question. `count` is `questionCount`'s result: "Question 2 of 5: Do you agree?". */
	questionAnnouncement: (count: string, title: string) => string;
	/** One scale button's spoken name: "7 out of 10". */
	scaleValue: (value: number, max: number) => string;
	/** A required question that is not a `multiple` is unanswered. */
	errorRequired: string;
	/** A required `multiple` question has no box ticked. */
	errorRequiredChoice: string;
	/** Fewer options ticked than the question's `min`. */
	errorMinSelected: (min: number) => string;
	/** More options ticked than the question's `max`. */
	errorMaxSelected: (max: number) => string;
	/** Fewer characters typed than the question's `minLength`. */
	errorMinLength: (min: number) => string;
	/** More characters typed than the question's `maxLength`. */
	errorMaxLength: (max: number) => string;
	/** A number outside a scale's or rating's range. */
	errorOutOfRange: (min: number, max: number) => string;
	/** An "Other" option is chosen with no text. */
	errorOtherRequired: string;
};

/** Rating's spoken strings. */
export type RatingLabels = {
	/** The stars' accessible name, read before the value. */
	name: string;
	/**
	 * The stars' spoken value. `formatted` is the value already formatted for the locale (whole
	 * numbers without decimals, at most two otherwise): "3.5 out of 5".
	 */
	value: (formatted: string, count: number) => string;
};

/** Screen's visible and spoken strings. */
export type ScreenLabels = {
	/** `Screen.Navbar.BackButton`'s accessible name. */
	back: string;
	/** `Screen.Loading`'s spinner name and announcement, when no `label` prop is given. */
	loading: string;
	/** `Screen.Error`'s heading, when no `title` prop is given. */
	errorTitle: string;
	/**
	 * What is spoken when `Screen.Error` appears. Called with the trimmed title and message, which
	 * may be empty: the default drops an empty part and closes the title with a full stop unless it
	 * already ends in punctuation.
	 */
	errorAnnouncement: (title: string, message: string) => string;
};

/** SearchBar's visible and spoken strings. */
export type SearchBarLabels = {
	/** The Cancel action's visible text. */
	cancel: string;
	/** The clear button's accessible name. */
	clear: string;
	/** The field's placeholder, and its accessible name when no `Field.Label` gives one. */
	placeholder: string;
	/** A token chip's close control name, "Remove Sale". */
	removeToken: (label: string) => string;
};

/** SectionProgress's spoken strings. */
export type SectionProgressLabels = {
	/** The pill's accessible name. */
	pill: string;
	/**
	 * The pill's spoken value, "Pricing, 42 percent". `percent` is a whole number 0 to 100, already
	 * rounded and clamped; `title` is the active section's title, empty when there is none, in which
	 * case only the percentage is read.
	 */
	value: (title: string, percent: number) => string;
};

/** SectionRail's spoken strings. */
export type SectionRailLabels = {
	/** The trigger's accessible name; its value is the active section's title. */
	trigger: string;
};

/** Select's visible and spoken strings. */
export type SelectLabels = {
	/** The trigger's hint, read after its name: tells a screen reader it opens a list. Omitted while read-only. */
	opensList: string;
	/** The sheet's search field placeholder and accessible name. */
	searchPlaceholder: string;
	/** What an empty list says: no options, or nothing matching the search. */
	empty: string;
	/** A multiple trigger's text past `maxLabels`, "3 selected". */
	selectedCount: (count: number) => string;
	/** The description of a row disabled by `maxSelected` that has none of its own. */
	limitReached: string;
	/** The multiple sheet's footer button, which closes it. */
	done: string;
	/** A row's accessible name: its label, then its description when it has one, "Engineer, Limit reached". */
	option: (label: string, description: string | undefined) => string;
};

/** SelectionMode's visible and spoken strings. */
export type SelectionModeLabels = {
	/** The header's title while no total is known to count against; also its visible default. Visible, and the lead of the "n of m" readout. */
	title: string;
	/** The header's count with no total, as shown and announced: "3 selected". */
	selectedCount: (count: number) => string;
	/**
	 * The header's count against a total, as shown and announced: "3 of 12", or "Select · 3 of 12"
	 * when a title is given. `title` is the header's resolved title (the `title` prop, else the
	 * `title` label above) and may be an empty string, in which case it is dropped.
	 */
	progress: (count: number, total: number, title: string) => string;
	/** The header's close button's accessible name. */
	stopSelecting: string;
	/** The header's select-all button, visible, while something is left to add. */
	selectAll: string;
	/** The header's select-all button, visible, once everything is selected. */
	deselectAll: string;
	/** An active item's hint, read after its name and checked state. */
	itemHint: string;
	/** The custom action an inactive item offers a screen reader to enter the mode. */
	startSelecting: string;
};

/** Signature's visible and spoken strings. */
export type SignatureLabels = {
	/** The pad's name when neither it nor an enclosing `Field` has one. */
	name: string;
	/** An empty pad's accessible name, given its name: "Signature pad, empty". */
	empty: (name: string) => string;
	/** A drawn pad's accessible name, given its name and stroke count: "Signature, drawn, 2 strokes". */
	drawn: (name: string, strokes: number) => string;
	/** Shown on the pad while it is empty. */
	placeholder: string;
	/** Read after the name while the pad takes input. */
	drawHint: string;
	/** Read before `drawHint` while a double tap opens the typed-name route. */
	typeHint: string;
	undo: string;
	redo: string;
	/** "Clear signature" rather than "Clear": clear is final and the label is the only warning. */
	clear: string;
	/** The pad's custom action that opens the typed-name route. */
	type: string;
	/** `Signature.Alternative`'s text. */
	alternative: string;
	/** Announced when the first stroke lands. */
	captured: string;
	/** Announced when the pad is cleared. */
	cleared: string;
};

/** What a Sketch tool or shape can be named. Restates `SketchTool | SketchShape`: the catalog imports nothing. */
export type SketchToolName =
	| "pen"
	| "eraser"
	| "shape"
	| "arrow"
	| "diamond"
	| "ellipse"
	| "heart"
	| "line"
	| "rectangle"
	| "star"
	| "triangle";

/** Sketch's spoken strings. */
export type SketchLabels = {
	/** A toolbar tool's or shape's accessible name: "Pen", "Rectangle". */
	tool: (name: SketchToolName) => string;
	/** The stroke-width slider thumb's accessible name. */
	size: string;
	/** The canvas' accessible name, empty vs counted: "Drawing, empty", "Drawing, 3 marks". An eraser counts as a mark. */
	drawing: (markCount: number) => string;
	/** A colour swatch's name when its colour is a theme token; `token` is the token's words, lower-case: "muted foreground". */
	swatchToken: (token: string) => string;
	/** A colour swatch's name when its colour is a literal and has no speakable name; `position` is one-based: "Colour 2 of 5". */
	swatchPosition: (position: number, count: number) => string;
	/** The undo button's name, and the canvas' undo action. */
	undo: string;
	/** The canvas' clear action. */
	clear: string;
	/** Spoken on iOS after an undo removes a mark. */
	undone: string;
};

/** SlideButton's spoken strings. */
export type SlideButtonLabels = {
	/** The custom action that confirms without sliding, offered to screen readers. */
	confirm: string;
	/** Spoken while the confirmation is pending (polite). */
	working: string;
	/** Spoken once the slide is confirmed (polite). */
	confirmed: string;
	/** Spoken when the action failed and the handle returned (assertive). */
	failed: string;
};

/** Slider's spoken strings: a thumb's name when nothing names it. */
export type SliderLabels = {
	/** A range's first thumb with no name to hang it on. */
	minimum: string;
	/** A range's second thumb with no name to hang it on. */
	maximum: string;
	/** A range's first thumb after the slider's name: "Price range, minimum". */
	minimumOf: (name: string) => string;
	/** A range's second thumb after the slider's name: "Price range, maximum". */
	maximumOf: (name: string) => string;
	/** A thumb past the second, after the slider's name; `index` is one-based: "Stops, 3 of 3". */
	positionOf: (name: string, index: number, count: number) => string;
	/** A thumb past the second with no name; `index` is one-based: "Thumb 3 of 3". */
	position: (index: number, count: number) => string;
};

/** Sortable's spoken strings. */
export type SortableLabels = {
	/** The drag handle's name when its row has no `label`. */
	handle: string;
	/** The drag handle's name for a labelled row: "Reorder Milk". */
	handleFor: (label: string) => string;
	/** The Move up action's name when the row has no `label`. */
	moveUp: string;
	/** The Move up action's name for a labelled row: "Move Milk up". */
	moveUpFor: (label: string) => string;
	/** The Move down action's name when the row has no `label`. */
	moveDown: string;
	/** The Move down action's name for a labelled row: "Move Milk down". */
	moveDownFor: (label: string) => string;
	/** A row's place, one-based, read as its value and announced after a move: "Position 2 of 5". */
	position: (current: number, count: number) => string;
};

/** SplitView's spoken strings. */
export type SplitViewLabels = {
	/** The drag row's accessible name when the app gives none. */
	dragArea: string;
	/** The drag row's value and the cycle announcement, one-based: "Position 2 of 3". */
	position: (current: number, count: number) => string;
	/** The drag row's activate action: move to the next snap point. */
	nextPosition: string;
};

/** Splitter's spoken strings. */
export type SplitterLabels = {
	/** A handle's name when the caller gives none. */
	handle: string;
	/** A handle's value, the leading pane's share; `percent` is unrounded: "35 percent". */
	value: (percent: number) => string;
	/** The reset action's name. */
	resetAction: string;
	/** The collapse action's name, offered while the adjacent pane is open. */
	collapseAction: string;
	/** The expand action's name, offered while the adjacent pane is collapsed. */
	expandAction: string;
	/** Spoken once after a reset. */
	reset: string;
	/** Spoken once after a collapse. */
	collapsed: string;
	/** Spoken once after an expand. */
	expanded: string;
};

/** StackCard's spoken strings. */
export type StackCardLabels = {
	/** A downward throw's action and button name, and the answer spoken after one. */
	swipeDown: string;
	/** A throw to the left's action and button name, and the answer spoken after one. */
	swipeLeft: string;
	/** A throw to the right's action and button name, and the answer spoken after one. */
	swipeRight: string;
	/** An upward throw's action and button name, and the answer spoken after one. */
	swipeUp: string;
	/** The undo action's and the undo button's name. */
	undo: string;
	/** Read when a throw empties a deck that has no `Empty` text. */
	empty: string;
	/** What a card with no `accessibilityLabel` is called; one-based: "Card 2 of 3". */
	position: (position: number, count: number) => string;
	/** Spoken after a throw, the answer then the card now on top: "Like. Next: Grace". */
	throwAnnouncement: (direction: string, card: string) => string;
	/** Spoken after a throw that empties the deck: "Like. No more cards". */
	emptyAnnouncement: (direction: string, empty: string) => string;
	/** Spoken after an undo, with the restored card: "Undone. Grace". */
	undoAnnouncement: (card: string) => string;
};

/** Steps' spoken strings. */
export type StepsLabels = {
	/** A step's place, one-based; `count` is 0 when the root could not count: "Step 2 of 3", "Step 2". */
	position: (step: number, count: number) => string;
	/** The status word for a step before the value. */
	completed: string;
	/** The status word for the step at the value. */
	current: string;
	/** The status word for a step after the value. */
	upcoming: string;
	/** Read when the step is invalid. */
	error: string;
	/** Read while the step loads. */
	loading: string;
	/** A step's whole spoken value, its non-empty parts joined: "Step 2 of 3, current, loading". */
	value: (parts: readonly string[]) => string;
};

/** How available a support team is, as the catalog names it. Restates `SupportAvailability`. */
export type SupportLabelAvailability = "online" | "away" | "offline";

/** A support ticket's state, as the catalog names it. Restates `SupportTicketStatus`. */
export type SupportLabelTicketStatus = "open" | "pending" | "solved" | "closed";

/** Support's visible and spoken strings. */
export type SupportLabels = {
	/** The availability word, shown and spoken first: "Online". */
	availability: (availability: SupportLabelAvailability) => string;
	/** The availability word inside a spoken sentence: "online". */
	availabilitySpoken: (availability: SupportLabelAvailability) => string;
	/** The status line's sentence when the app gives no reply time: "We're online". */
	availabilityStatus: (availability: SupportLabelAvailability) => string;
	/** A ticket status badge's words: "Waiting on you". */
	ticketStatus: (status: SupportLabelTicketStatus) => string;
	/** A ticket status inside a spoken sentence: "waiting on you". */
	ticketStatusSpoken: (status: SupportLabelTicketStatus) => string;
	/** The status row's spoken label, the word then the app's wording: "Away. Back tomorrow". */
	statusSpoken: (word: string, wording: string) => string;
	/** The agent row's visible line when it has a title: "Support · Online". */
	agentStatusLine: (title: string, word: string) => string;
	/** The agent row's spoken label, its non-empty parts joined: "Omar Haddad, Support, online". */
	agentSpoken: (parts: readonly string[]) => string;
	/** Typing, shown with the first name and spoken with the full one: "Omar is typing". */
	typing: (name: string) => string;
	/** The stand-in for a blank name. */
	someone: string;
	/** A row's reference and time joined for the visible meta line: "#4821 · 2h". */
	meta: (parts: readonly string[]) => string;
	/** The conversation row's spoken head, its non-empty parts joined: "Refund, solved, unread reply, 2h". */
	conversationSpoken: (parts: readonly string[]) => string;
	/** The conversation row's spoken label with a preview: "Refund, solved. We've issued it." */
	conversationWithPreview: (head: string, preview: string) => string;
	/** Read for a thread with an unread reply. */
	unreadReply: string;
	/** Read for a thread that moved with nothing new. */
	updated: string;
	/** A topic's spoken label with its description: "Billing. Invoices, refunds and plans". */
	topicSpoken: (label: string, description: string) => string;
	/** The hint on a reply that reaches a person. */
	escalateHint: string;
};

/** Table's spoken strings. */
export type TableLabels = {
	/** A sortable head's value while it sorts ascending. */
	sortedAscending: string;
	/** A sortable head's value while it sorts descending. */
	sortedDescending: string;
	/** A sortable head's value while another column sorts. */
	notSorted: string;
	/** A cell's name, its column's header then its value: "Qty, 3". Called only when the header has text. */
	cell: (header: string, value: string | number) => string;
	/** A pressable row's name, every cell's non-empty label in order: "Widget, 3, $9". */
	row: (parts: readonly string[]) => string;
};

/** TagInput's spoken strings. */
export type TagInputLabels = {
	/** One tag's remove control and the chip's remove action: "Remove design". */
	remove: (tag: string) => string;
	/** The clear-all control's accessible name. */
	clearAll: string;
	/** Spoken after a commit adds tags: "Added design, react". */
	added: (tags: readonly string[]) => string;
	/** Spoken after a tag is removed: "Removed design". */
	removed: (tag: string) => string;
	/** Spoken when a tag is refused as a duplicate. */
	rejectDuplicate: string;
	/** Spoken when a commit has nothing to add. */
	rejectEmpty: string;
	/** Spoken when `validate` refuses a tag. */
	rejectInvalid: string;
	/** Spoken when `max` is already reached. */
	rejectMax: string;
	/** The field's spoken value: "No tags", "1 tag", "3 tags". */
	tags: (count: number) => string;
};

/** Textarea's spoken strings. */
export type TextareaLabels = {
	/** The character count's spoken name: "12 of 280 characters". */
	count: (length: number, maxLength: number) => string;
	/** Spoken once on entering the last tenth of the limit: "19 characters remaining". */
	remaining: (remaining: number) => string;
	/** Spoken once at the limit. */
	limitReached: string;
};

/** ThemeSelector's visible and spoken strings. */
export type ThemeSelectorLabels = {
	/** The System option's caption, which is also its name. */
	system: string;
	/** The Light option's caption, which is also its name. */
	light: string;
	/** The Dark option's caption, which is also its name. */
	dark: string;
	/** The group's name when no `accessibilityLabel` or `Field.Label` gives one. */
	group: string;
};

/** TimePicker's visible and spoken strings. */
export type TimePickerLabels = {
	/** The sheet's heading. */
	title: string;
	/** The sheet's confirm button. */
	done: string;
	/** The sheet's clear button. */
	clear: string;
	/** The trigger's text while no time is set. */
	placeholder: string;
	/** The trigger's name when neither a prop nor `Field.Label` gives one. */
	trigger: string;
	/** The trigger's hint when it opens a sheet. */
	triggerHint: string;
	/** The trigger's spoken value while no time is set. */
	notSet: string;
	/** The hour wheel's name. */
	hour: string;
	/** The minute wheel's name. */
	minute: string;
	/** The second wheel's name. */
	second: string;
	/** The AM/PM wheel's name. */
	period: string;
	/**
	 * An inline wheel's name, led by the field's: "Reminder, Hour". `required` is the field's
	 * required word when the field is required: "Reminder, Hour, required".
	 */
	column: (field: string, column: string, required: string | undefined) => string;
	/** The hour wheel's spoken value: "3 o'clock". */
	hourValue: (hour: number) => string;
	/** The minute wheel's spoken value: "30 minutes". */
	minuteValue: (minutes: number) => string;
	/** The second wheel's spoken value: "15 seconds". */
	secondValue: (seconds: number) => string;
};

/** Timeline's spoken strings. */
export type TimelineLabels = {
	/**
	 * An event's whole spoken value. `position` is one-based, `count` is 0 when the root could not
	 * count, and `tone` is undefined for the default tone: "Event 2 of 6, completed, success".
	 */
	itemValue: (parts: { position: number; count: number; status: string; tone: string | undefined }) => string;
	/** The status word for a passed event. */
	completed: string;
	/** The status word for the event at the value. */
	current: string;
	/** The status word for an event not yet reached. */
	upcoming: string;
	/** The tone word for an info event. */
	toneInfo: string;
	/** The tone word for a success event. */
	toneSuccess: string;
	/** The tone word for a warning event. */
	toneWarning: string;
	/** The tone word for a destructive event. */
	toneDestructive: string;
};

/** Toast's spoken strings. */
export type ToastLabels = {
	/** `Toast.Close`'s name, and the card's dismiss action. */
	dismiss: string;
	/** `Toast.Action`'s name when it has no `accessibilityLabel` and no string child. */
	action: string;
	/** The sentence spoken when a toast appears or changes. Called only with a description. */
	announcement: (title: string, description: string) => string;
};

/** Tour's visible and spoken strings. */
export type TourLabels = {
	/** The primary action on every step but the last. */
	next: string;
	/** The action that returns to the previous step. */
	back: string;
	/** The action that ends the tour early. */
	skip: string;
	/** The last step's primary action. */
	finish: string;
	/** The visible position, "2 of 5". One-based. */
	progress: (current: number, total: number) => string;
	/** What a screen reader hears before the title, "Step 2 of 5". One-based. */
	announcement: (current: number, total: number) => string;
};

/** Tree's spoken strings. */
export type TreeLabels = {
	/** A row's spoken value, its depth: "Level 2". */
	level: (level: number) => string;
	/** The action on a closed branch. */
	expand: string;
	/** The action on an open branch. */
	collapse: string;
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
	messageScroller: MessageScrollerLabels;
	motion: MotionLabels;
	numberInput: NumberInputLabels;
	otpInput: OtpInputLabels;
	pageHeader: PageHeaderLabels;
	pagination: PaginationLabels;
	planner: PlannerLabels;
	popover: PopoverLabels;
	post: PostLabels;
	progress: ProgressLabels;
	progressButton: ProgressButtonLabels;
	qrCode: QrCodeLabels;
	questionnaire: QuestionnaireLabels;
	rating: RatingLabels;
	screen: ScreenLabels;
	searchBar: SearchBarLabels;
	sectionProgress: SectionProgressLabels;
	sectionRail: SectionRailLabels;
	select: SelectLabels;
	selectionMode: SelectionModeLabels;
	signature: SignatureLabels;
	sketch: SketchLabels;
	slideButton: SlideButtonLabels;
	slider: SliderLabels;
	sortable: SortableLabels;
	splitView: SplitViewLabels;
	splitter: SplitterLabels;
	stackCard: StackCardLabels;
	steps: StepsLabels;
	support: SupportLabels;
	table: TableLabels;
	tagInput: TagInputLabels;
	textarea: TextareaLabels;
	themeSelector: ThemeSelectorLabels;
	timePicker: TimePickerLabels;
	timeline: TimelineLabels;
	toast: ToastLabels;
	tour: TourLabels;
	tree: TreeLabels;
};

/** A component whose strings the catalog holds. */
export type DelacourLabelsComponent = keyof DelacourLabels;

/** Some of each component's labels — what `DelacourProvider`'s `labels` prop takes. */
export type DelacourLabelOverrides = { [K in DelacourLabelsComponent]?: Partial<DelacourLabels[K]> };

const plural = (count: number, one: string, other: string): string => (count === 1 ? one : other);

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const SKETCH_TOOL_NAMES = {
	arrow: "Arrow",
	diamond: "Diamond",
	ellipse: "Ellipse",
	eraser: "Eraser",
	heart: "Heart",
	line: "Line",
	pen: "Pen",
	rectangle: "Rectangle",
	shape: "Shape",
	star: "Star",
	triangle: "Triangle",
} as const;

const MONTHS_LONG = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

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
		triggerInField: (fieldLabel, placeholder) => `${fieldLabel}, ${placeholder}`,
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
		applied: (name) => `${name} applied`,
		removed: (name) => `${name} removed`,
		write: "Write",
		preview: "Preview",
		previewPane: "Preview",
		empty: "Nothing to preview",
		bulletItem: (text) => `bullet ${text}`,
		openLink: (text) => `Open link ${text}`,
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
	messageScroller: {
		list: "Conversation",
		jumpToLatest: "Jump to latest",
		jumpToLatestUnread: (base, count) => `${base}, ${count} unread`,
		loadingOlder: "Loading older messages",
		today: "Today",
		yesterday: "Yesterday",
		weekday: (day) => WEEKDAYS[day] ?? "",
		month: (month) => MONTHS[month] ?? "",
		date: (day, month, year) => (year === undefined ? `${day} ${month}` : `${day} ${month} ${year}`),
		unreadDivider: (count) => `${count} new ${plural(count, "message", "messages")}`,
		newMessages: (count, senderName) => {
			if (count !== 1) return `${count} new messages`;
			return senderName ? `New message from ${senderName}` : "New message";
		},
	},
	motion: {
		pause: "Pause animation",
		resume: "Resume animation",
	},
	numberInput: {
		decrease: "Decrease",
		increase: "Increase",
		limit: (text, bound) => `${text}, ${bound === "max" ? "maximum" : "minimum"}`,
	},
	otpInput: {
		defaultLabel: "Verification code",
		progress: (entered, length, unit) => `${entered} of ${length} ${unit}s entered`,
		hint: (length, unit) => `Enter the ${length} ${unit} code`,
	},
	pageHeader: {
		verifiedAvatar: (name) => `${name}, verified`,
		verified: "Verified",
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
	planner: {
		previousMonth: "Previous month",
		nextMonth: "Next month",
		today: "Today",
		entryCount: (count) => (count === 0 ? "no entries" : `${count} ${plural(count, "entry", "entries")}`),
		day: (date, entries, names, isToday) => [date, entries, ...names, ...(isToday ? ["today"] : [])].join(", "),
		legendCount: (name, count) => `${name}, ${count}`,
		summary: (count, month) =>
			`${count === 0 ? "No entries" : `${count} ${plural(count, "entry", "entries")}`} in ${month}`,
		more: (count) => `+${count} more`,
	},

	popover: {
		close: "Close",
	},

	post: {
		timeShort: (ago) => {
			switch (ago.unit) {
				case "now":
					return "now";
				case "minute":
					return `${ago.count}m`;
				case "hour":
					return `${ago.count}h`;
				case "day":
					return `${ago.count}d`;
				case "date":
					return `${MONTHS[ago.month]} ${ago.day}${ago.year === undefined ? "" : `, ${ago.year}`}`;
			}
		},
		timeSpoken: (ago) => {
			switch (ago.unit) {
				case "now":
					return "just now";
				case "minute":
					return `${ago.count} ${plural(ago.count, "minute", "minutes")} ago`;
				case "hour":
					return `${ago.count} ${plural(ago.count, "hour", "hours")} ago`;
				case "day":
					return `${ago.count} ${plural(ago.count, "day", "days")} ago`;
				case "date":
					return `${MONTHS_LONG[ago.month]} ${ago.day}${ago.year === undefined ? "" : `, ${ago.year}`}`;
			}
		},
		author: ({ name, handle, isVerified, spokenTime }) => {
			const parts = [name];
			if (handle) parts.push(handle);
			if (isVerified) parts.push("verified");
			if (spokenTime) parts.push(spokenTime);
			return parts.join(", ");
		},
		community: (name, meta) => (meta === undefined ? name : `${name}, ${meta}`),
		stat: (label, value) => `${label}, ${value}`,
		score: (score) => `Score ${score}`,
		upvote: "Upvote",
		downvote: "Downvote",
		voteAnnouncement: (vote, score) =>
			`${vote === "up" ? "Upvoted" : vote === "down" ? "Downvoted" : "Vote removed"}, score ${score}`,
		more: "more",
		less: "less",
		showMore: "Show more",
		showLess: "Show less",
		openPost: "Open post",
		moreOptions: "More options",
	},

	progress: {
		valueOf: (current, max) => `${current} of ${max}`,
	},

	progressButton: {
		hint: "Press and hold to confirm",
		completed: "Done",
	},

	qrCode: {
		code: (shown) => `QR code: ${shown}`,
		unavailable: "QR code unavailable",
	},

	questionnaire: {
		back: "Back",
		next: "Next",
		submit: "Submit",
		skip: "Skip",
		skipQuestion: "Skip this question",
		answerRequired: "Answer required",
		yes: "Yes",
		no: "No",
		otherAnswer: "Other answer",
		otherPlaceholder: "Please specify",
		questionCount: (current, total) => `Question ${current} of ${total}`,
		questionAnnouncement: (count, title) => `${count}: ${title}`,
		scaleValue: (value, max) => `${value} out of ${max}`,
		errorRequired: "Answer this question to continue.",
		errorRequiredChoice: "Choose at least 1 option.",
		errorMinSelected: (min) => `Choose at least ${min} ${plural(min, "option", "options")}.`,
		errorMaxSelected: (max) => `Choose no more than ${max} ${plural(max, "option", "options")}.`,
		errorMinLength: (min) => `Enter at least ${min} ${plural(min, "character", "characters")}.`,
		errorMaxLength: (max) => `Use no more than ${max} ${plural(max, "character", "characters")}.`,
		errorOutOfRange: (min, max) => `Choose a value from ${min} to ${max}.`,
		errorOtherRequired: "Describe your other answer.",
	},

	rating: {
		name: "Rating",
		value: (formatted, count) => `${formatted} out of ${count}`,
	},

	screen: {
		back: "Back",
		loading: "Loading",
		errorTitle: "Something went wrong",
		errorAnnouncement: (title, message) => {
			if (title === "") return message;
			if (message === "") return title;
			return /[.!?]$/.test(title) ? `${title} ${message}` : `${title}. ${message}`;
		},
	},

	searchBar: {
		cancel: "Cancel",
		clear: "Clear search",
		placeholder: "Search",
		removeToken: (label) => `Remove ${label}`,
	},

	sectionProgress: {
		pill: "Sections",
		value: (title, percent) => (title === "" ? `${percent} percent` : `${title}, ${percent} percent`),
	},

	sectionRail: {
		trigger: "Sections",
	},

	select: {
		opensList: "Opens a list of options",
		searchPlaceholder: "Search",
		empty: "No results",
		selectedCount: (count) => `${count} selected`,
		limitReached: "Limit reached",
		done: "Done",
		option: (label, description) => (description ? `${label}, ${description}` : label),
	},

	selectionMode: {
		title: "Select",
		selectedCount: (count) => `${count} selected`,
		progress: (count, total, title) => (title ? `${title} · ${count} of ${total}` : `${count} of ${total}`),
		stopSelecting: "Stop selecting",
		selectAll: "Select all",
		deselectAll: "Deselect all",
		itemHint: "Double-tap to select",
		startSelecting: "Start selecting",
	},

	signature: {
		name: "Signature",
		empty: (name) => `${name} pad, empty`,
		drawn: (name, strokes) => `${name}, drawn, ${strokes} ${plural(strokes, "stroke", "strokes")}`,
		placeholder: "Sign here",
		drawHint: "Double tap and hold, then drag to draw.",
		typeHint: "Double tap to type your name instead.",
		undo: "Undo",
		redo: "Redo",
		clear: "Clear signature",
		type: "Type your name instead",
		alternative: "Can't sign? Type your name",
		captured: "Signature captured",
		cleared: "Signature cleared",
	},

	sketch: {
		tool: (name) => SKETCH_TOOL_NAMES[name],
		size: "Stroke width",
		drawing: (markCount) =>
			markCount === 0 ? "Drawing, empty" : `Drawing, ${markCount} ${plural(markCount, "mark", "marks")}`,
		swatchToken: (token) => token.charAt(0).toUpperCase() + token.slice(1),
		swatchPosition: (position, count) => `Colour ${position} of ${count}`,
		undo: "Undo",
		clear: "Clear",
		undone: "Undone",
	},

	slideButton: {
		confirm: "Confirm",
		working: "Working",
		confirmed: "Confirmed",
		failed: "Failed. Slide to try again",
	},
	slider: {
		minimum: "Minimum",
		maximum: "Maximum",
		minimumOf: (name) => `${name}, minimum`,
		maximumOf: (name) => `${name}, maximum`,
		positionOf: (name, index, count) => `${name}, ${index} of ${count}`,
		position: (index, count) => `Thumb ${index} of ${count}`,
	},
	sortable: {
		handle: "Drag to reorder",
		handleFor: (label) => `Reorder ${label}`,
		moveUp: "Move up",
		moveUpFor: (label) => `Move ${label} up`,
		moveDown: "Move down",
		moveDownFor: (label) => `Move ${label} down`,
		position: (current, count) => `Position ${current} of ${count}`,
	},
	splitView: {
		dragArea: "Resize panes",
		position: (current, count) => `Position ${current} of ${count}`,
		nextPosition: "Next position",
	},
	splitter: {
		handle: "Resize",
		value: (percent) => `${Math.round(percent)} percent`,
		resetAction: "Reset sizes",
		collapseAction: "Collapse",
		expandAction: "Expand",
		reset: "Sizes reset",
		collapsed: "Pane collapsed",
		expanded: "Pane expanded",
	},
	stackCard: {
		swipeDown: "Swipe down",
		swipeLeft: "Swipe left",
		swipeRight: "Swipe right",
		swipeUp: "Swipe up",
		undo: "Undo",
		empty: "No more cards",
		position: (position, count) => `Card ${position} of ${count}`,
		throwAnnouncement: (direction, card) => `${direction}. Next: ${card}`,
		emptyAnnouncement: (direction, empty) => `${direction}. ${empty}`,
		undoAnnouncement: (card) => `Undone. ${card}`,
	},
	steps: {
		position: (step, count) => (count > 0 ? `Step ${step} of ${count}` : `Step ${step}`),
		completed: "completed",
		current: "current",
		upcoming: "upcoming",
		error: "has an error",
		loading: "loading",
		value: (parts) => parts.join(", "),
	},
	support: {
		availability: (availability) => ({ online: "Online", away: "Away", offline: "Offline" })[availability],
		availabilitySpoken: (availability) => ({ online: "online", away: "away", offline: "offline" })[availability],
		availabilityStatus: (availability) =>
			({ online: "We're online", away: "We're away", offline: "We're offline" })[availability],
		ticketStatus: (status) => ({ open: "Open", pending: "Waiting on you", solved: "Solved", closed: "Closed" })[status],
		ticketStatusSpoken: (status) =>
			({ open: "open", pending: "waiting on you", solved: "solved", closed: "closed" })[status],
		statusSpoken: (word, wording) => `${word}. ${wording}`,
		agentStatusLine: (title, word) => `${title} · ${word}`,
		agentSpoken: (parts) => parts.join(", "),
		typing: (name) => `${name} is typing`,
		someone: "Someone",
		meta: (parts) => parts.join(" · "),
		conversationSpoken: (parts) => parts.join(", "),
		conversationWithPreview: (head, preview) => `${head}. ${preview}`,
		unreadReply: "unread reply",
		updated: "updated",
		topicSpoken: (label, description) => `${label}. ${description}`,
		escalateHint: "Talk to a person",
	},
	table: {
		sortedAscending: "sorted ascending",
		sortedDescending: "sorted descending",
		notSorted: "not sorted",
		cell: (header, value) => `${header}, ${value}`,
		row: (parts) => parts.join(", "),
	},
	tagInput: {
		remove: (tag) => `Remove ${tag}`,
		clearAll: "Clear all",
		added: (tags) => `Added ${tags.join(", ")}`,
		removed: (tag) => `Removed ${tag}`,
		rejectDuplicate: "Duplicate, not added",
		rejectEmpty: "Nothing to add",
		rejectInvalid: "Not valid, not added",
		rejectMax: "Limit reached, not added",
		tags: (count) => (count === 0 ? "No tags" : `${count} ${plural(count, "tag", "tags")}`),
	},
	textarea: {
		count: (length, maxLength) => `${length} of ${maxLength} characters`,
		remaining: (remaining) => `${remaining} ${plural(remaining, "character", "characters")} remaining`,
		limitReached: "Character limit reached",
	},
	themeSelector: {
		system: "System",
		light: "Light",
		dark: "Dark",
		group: "Theme",
	},
	timePicker: {
		title: "Select time",
		done: "Done",
		clear: "Clear",
		placeholder: "Select time",
		trigger: "Time",
		triggerHint: "Opens time picker",
		notSet: "not set",
		hour: "Hour",
		minute: "Minute",
		second: "Second",
		period: "AM or PM",
		column: (field, column, required) =>
			required === undefined ? `${field}, ${column}` : `${field}, ${column}, ${required}`,
		hourValue: (hour) => `${hour} o'clock`,
		minuteValue: (minutes) => `${minutes} ${plural(minutes, "minute", "minutes")}`,
		secondValue: (seconds) => `${seconds} ${plural(seconds, "second", "seconds")}`,
	},
	timeline: {
		itemValue: ({ position, count, status, tone }) => {
			const place = count > 0 ? `Event ${position} of ${count}` : `Event ${position}`;
			return tone === undefined ? `${place}, ${status}` : `${place}, ${status}, ${tone}`;
		},
		completed: "completed",
		current: "current",
		upcoming: "upcoming",
		toneInfo: "info",
		toneSuccess: "success",
		toneWarning: "warning",
		toneDestructive: "error",
	},
	toast: {
		dismiss: "Dismiss",
		action: "Action",
		announcement: (title, description) => `${title}. ${description}`,
	},
	tour: {
		next: "Next",
		back: "Back",
		skip: "Skip",
		finish: "Done",
		progress: (current, total) => `${current} of ${total}`,
		announcement: (current, total) => `Step ${current} of ${total}`,
	},
	tree: {
		level: (level) => `Level ${level}`,
		expand: "Expand",
		collapse: "Collapse",
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
