export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
    // Restore prototype chain (TypeScript + extending Error)
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static notFound(message = "Not found", code?: string): AppError {
    return new AppError(404, message, code);
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(400, message, code);
  }

  static internal(message = "Internal server error", code?: string): AppError {
    return new AppError(500, message, code);
  }
}
