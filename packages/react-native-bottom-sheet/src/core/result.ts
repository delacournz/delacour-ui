/**
 * The house `Result` — the shape `@delacour/types` defines, copied rather than
 * imported.
 *
 * `@delacour/types` is a private workspace package and this one publishes. A
 * `workspace:*` dependency on something npm has never seen would resolve for
 * every workspace consumer and for nobody else; the twelve lines below are
 * cheaper than making the types package public for a single union.
 */
export type SuccessResult<Success> = { success: true; data: Success };
export type ErrorResult<Error = string> = { success: false; error: Error };
export type Result<Success, Error = string> = SuccessResult<Success> | ErrorResult<Error>;

export function ok<T>(data: T): SuccessResult<T> {
	return { success: true, data };
}

export function err<E>(error: E): ErrorResult<E> {
	return { success: false, error };
}
