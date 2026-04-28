import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  constructor(errors: string[], message = "Validation failed") {
    super(message, 400, errors);
    this.name = "ValidationError";
  }
}
