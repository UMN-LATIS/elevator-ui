export class ApiError extends Error {
  public readonly name = "ApiError";
  public readonly statusCode: number;
  public readonly data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;

    // this is for somewhat more readable stack traces
    // we manually create a stack trace here to avoid including
    // all the JS internals of the Error class
    this.stack = new Error(message).stack;
  }
}
