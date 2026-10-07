import type { Request, Response } from "express";
import { badRequest, notFound } from "../../lib/httpError";
import { findCategoryBySlug, listCategories } from "./repository";

export async function listCategoriesHandler(_req: Request, res: Response) {
  res.json({ data: await listCategories() });
}

export async function getCategoryHandler(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!/^[a-z0-9-]{1,80}$/i.test(slug)) throw badRequest("Invalid category slug");

  const category = await findCategoryBySlug(slug);
  if (!category) throw notFound("Category not found");

  res.json({ data: category });
}
