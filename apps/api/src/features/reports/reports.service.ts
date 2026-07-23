import { ForbiddenError, NotFoundError } from "@/core/errors/index.js";
import { reportsRepository } from "./reports.repository.js";
import type { ReportCreateInput, ReportUpdateInput } from "./reports.validation.js";

const DEFAULT_LIMIT = 100;

// The validated payload carries the Drive id under `drive`; rename it to the
// `driveId` column the repository expects.
function toRow(data: ReportUpdateInput) {
  const { drive, ...rest } = data;
  return drive !== undefined ? { ...rest, driveId: drive } : rest;
}

// Class reports are VIP-only. The gate lives here (not client-side) so
// drive_id never reaches free-tier clients — same convention as videos.
async function assertVipAccess(userId: string) {
  const profile = await reportsRepository.getProfileAccess(userId);
  if (!profile || (profile.tier !== "vip" && !profile.isAdmin)) {
    throw new ForbiddenError("VIP access required");
  }
}

export const reportsService = {
  async listPublished(userId: string, limit?: number) {
    await assertVipAccess(userId);
    return reportsRepository.listPublished(limit ?? DEFAULT_LIMIT);
  },

  async getBySlug(userId: string, slug: string) {
    await assertVipAccess(userId);
    const report = await reportsRepository.findPublishedBySlug(slug);
    if (!report || !report.published) throw new NotFoundError("Report not found");
    const { published: _published, ...rest } = report;
    return rest;
  },

  listAll: () => reportsRepository.listAll(),

  async getById(id: string) {
    const report = await reportsRepository.findById(id);
    if (!report) throw new NotFoundError("Report not found");
    return report;
  },

  create: (data: ReportCreateInput) => {
    const { drive, ...rest } = data;
    return reportsRepository.create({ ...rest, driveId: drive });
  },

  async update(id: string, data: ReportUpdateInput) {
    await reportsService.getById(id);
    return reportsRepository.update(id, toRow(data));
  },

  async delete(id: string) {
    await reportsService.getById(id);
    await reportsRepository.delete(id);
  },
};
