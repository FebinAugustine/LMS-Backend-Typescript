class ApiErrors extends Error {
  statusCode: number;
  data: any | null;
  message: string;
  success: boolean;
  errors: any[];

  constructor(
    statusCode: number,
    message = "Something went wrong...!",
    errors = [],
    stack = ""
  ) {
    super(message); // Call the base Error constructor with the message

    this.statusCode = statusCode; // Assign properties with type annotations
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor); // Preserve stack trace
    }
  }
}

export { ApiErrors };
