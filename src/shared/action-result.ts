export type ActionResult<T = void> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; data?: T };

export function okResult<T = void>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, data };
}

export function errResult<T = void>(message: string, data?: T): ActionResult<T> {
  return { ok: false, message, data };
}
