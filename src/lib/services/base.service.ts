import { AppError } from '../errors/app-error';
export abstract class BaseService {
constructor() {}
protected validateId(id: string): void {
if (!id || typeof id !== 'string' || id.trim().length === 0) {
throw new AppError('Invalid ID provided', 400);
}
}
protected handleServiceError(error: unknown, context: string): never {
console.error(`[Service Error] ${context}:`, error);
if (error instanceof AppError) {
throw error;
}
if (error instanceof Error) {
throw new AppError(error.message, 500, false);
}
throw new AppError(
  `An unexpected error occurred in ${context}`,
  500,
  false
);
}
}