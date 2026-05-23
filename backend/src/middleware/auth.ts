import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  try {

    // =========================
    // GET AUTH HEADER
    // =========================

    const authHeader = req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // =========================
    // EXTRACT TOKEN
    // =========================

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {

      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    // =========================
    // VERIFY JWT
    // =========================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as {
      id: string;
      email: string;
    };

    // =========================
    // ATTACH USER
    // =========================

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    console.log('AUTH USER =>', req.user);

    next();

  } catch (err) {

    console.error('AUTH ERROR =>', err);

    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};