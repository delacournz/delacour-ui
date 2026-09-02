/**
 * The scale kinds a chart axis can take.
 *
 * `band` and `point` are deliberately absent: a line over categorical x uses
 * the datum's index against a linear scale, which is what `transformInputData`
 * substitutes when a field is not numeric. Band arrives with bars, where a
 * category genuinely needs a width rather than a position.
 */
export type ScaleType = "linear" | "time" | "log";

export type DomainTuple = readonly [number, number];
export type RangeTuple = readonly [number, number];

/**
 * A scale as plain, serialisable data.
 *
 * d3's scales are closures, and a closure cannot be read on the UI thread — a
 * shared value carries data, not functions. So every scale exists in two
 * forms: the d3 object, which stays on the JS thread and does the nicing and
 * the ticking, and this descriptor, which is what crosses into a worklet so
 * the scrub gesture can invert a touch x with no bridge hop.
 *
 * Keep it numbers only. The moment a field here is a function or a class
 * instance, `invertValue` stops working on the UI thread and the failure shows
 * up as a scrub dot that never moves.
 */
export type ScaleDescriptor =
	| { readonly kind: "linear"; readonly domain: DomainTuple; readonly range: RangeTuple }
	| { readonly kind: "time"; readonly domain: DomainTuple; readonly range: RangeTuple }
	| { readonly kind: "log"; readonly domain: DomainTuple; readonly range: RangeTuple; readonly base: number };
