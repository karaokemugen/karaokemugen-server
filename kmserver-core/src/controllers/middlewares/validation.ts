import { NextFunction, Request, Response } from "express";

import { uuidRegexp } from "../../lib/utils/constants.js";

export function validateUUID(...params: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const p of params) {
      if (!uuidRegexp.test(req.params[p])) {
        res.status(400).send(`Invalid UUID for parameter: ${p}`);
        return;
      }
    }
    next();
  };
}