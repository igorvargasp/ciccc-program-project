/** Application error carrying an HTTP status code and optional details. */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);
export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
