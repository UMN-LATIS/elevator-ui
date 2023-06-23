export class ApiError extends Error {
  public readonly name = "ApiError";
  public readonly statusCode: number;
  public readonly data?: unknown;
  public readonly rawMessage: string;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.rawMessage = message;
    this.message = this.getUserFriendlyMessage(statusCode);

    // this is for somewhat more readable stack traces
    // we manually create a stack trace here to avoid including
    // all the JS internals of the Error class
    this.stack = new Error(message).stack;
  }

  getUserFriendlyMessage(status: number): string {
    switch (status) {
      case 0:
        return "There was a problem connecting to the server. Please check your internet connection and try again.";
      case 401:
      case 403:
        return "You do not have permission to access this resource.";
      case 404:
        return "The resource you are looking for could not be found.";
      default:
        if (status >= 400 && status < 500) {
          return "There was a problem with your request. Please check your input and try again.";
        }
        if (status >= 500) {
          return "There was a problem on our end. We are working on fixing it.";
        }
        return this.rawMessage;
    }
  }
}
