import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: 'Resource not found.' });
}

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const status = error.statusCode || error.status || 500;
  const message = error.message || 'Unexpected server error.';

  if (status >= 500) {
    console.error('Unhandled error:', message);
  }

  return res.status(status).json({
    message: status >= 500 ? 'Something went wrong. Please try again later.' : message,
    error: status >= 500 ? undefined : message,
  });
}
