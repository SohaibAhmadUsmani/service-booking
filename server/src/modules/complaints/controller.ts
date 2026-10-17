import { Request, Response } from "express";
import { complaintsService } from "./service";
import { asyncHandler } from "../../lib/asyncHandler";

export class ComplaintsController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user!.userId;
    const complaint = await complaintsService.create(customerId, req.body);
    res.status(201).json({ status: "ok", data: complaint });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const complaint = await complaintsService.getById(req.params.id, userId, role);
    res.json({ status: "ok", data: complaint });
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { status, limit, offset } = req.query;

    const results = await complaintsService.list({
      userId,
      role,
      status: status ? String(status) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
    });

    res.json({ status: "ok", data: results });
  });

  static resolve = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.userId;
    const resolved = await complaintsService.resolve(req.params.id, adminId, req.body);
    res.json({ status: "ok", data: resolved, message: "Complaint updated successfully." });
  });
}
