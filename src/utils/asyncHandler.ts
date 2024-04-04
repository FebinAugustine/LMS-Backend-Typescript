import { Request, Response, NextFunction } from "express"; // Import types for Express

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (requestHandler: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requestHandler(req, res, next);
    } catch (error: any) {
      // Catch errors with type annotation
      next(error);
    }
  };
};

export { asyncHandler };
