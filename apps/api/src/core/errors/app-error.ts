export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors: string[] = [],
  ) {
    super(message);
    this.name = "AppError";
  }
}
