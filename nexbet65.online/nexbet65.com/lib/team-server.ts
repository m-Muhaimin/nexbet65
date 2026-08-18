import { prisma, queryWithRetry } from "@/lib/db";
import {
  generateAccessToken,
  hashAccessToken,
  tokenHint,
} from "@/lib/team";
import {
  ROLE_DEFAULT_PERMISSIONS,
  type TeamMemberDTO,
  type TeamPermission,
  type TeamRole,
} from "@/lib/team-types";

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toDTO(
  m: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
    tokenHint: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdBy: string;
    createdAt: Date;
  }
): TeamMemberDTO {
  return {
    id: m.id,
    name: m.name,
    role: (m.role as TeamRole) || "moderator",
    permissions: (m.permissions as TeamPermission[]) || [],
    tokenHint: m.tokenHint,
    isActive: m.isActive,
    lastLoginAt: m.lastLoginAt ? m.lastLoginAt.toISOString() : null,
    createdBy: m.createdBy,
    createdAt: m.createdAt.toISOString(),
  };
}

export function normalizePermissions(
  role: TeamRole,
  permissions?: TeamPermission[]
): TeamPermission[] {
  if (Array.isArray(permissions) && permissions.length > 0) return permissions;
  return ROLE_DEFAULT_PERMISSIONS[role] ?? [];
}

export async function listTeamMembers(): Promise<TeamMemberDTO[]> {
  return queryWithRetry(async () => {
    const members = await prisma.winTeamMember.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
    return members.map(toDTO);
  });
}

export async function createTeamMember(args: {
  name: string;
  role: TeamRole;
  permissions?: TeamPermission[];
  createdBy: string;
}): Promise<ServiceResult<{ member: TeamMemberDTO; token: string }>> {
  const name = args.name.trim();
  if (!name) return { ok: false, error: "Name is required" };
  if (!ROLE_DEFAULT_PERMISSIONS[args.role]) {
    return { ok: false, error: "Invalid role" };
  }

  const token = generateAccessToken();
  const permissions = normalizePermissions(args.role, args.permissions);

  const created = await queryWithRetry(async () => {
    return prisma.winTeamMember.create({
      data: {
        name,
        role: args.role,
        permissions,
        tokenHash: hashAccessToken(token),
        tokenHint: tokenHint(token),
        isActive: true,
        createdBy: args.createdBy,
      },
    });
  });

  return { ok: true, data: { member: toDTO(created), token } };
}

export async function updateTeamMember(
  id: string,
  patch: {
    name?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
    isActive?: boolean;
  }
): Promise<ServiceResult<{ member: TeamMemberDTO }>> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "Name is required" };
    data.name = name;
  }
  if (patch.role !== undefined) {
    if (!ROLE_DEFAULT_PERMISSIONS[patch.role]) {
      return { ok: false, error: "Invalid role" };
    }
    data.role = patch.role;
    if (patch.permissions !== undefined) {
      data.permissions = normalizePermissions(patch.role, patch.permissions);
    }
  } else if (patch.permissions !== undefined) {
    data.permissions = patch.permissions;
  }
  if (patch.isActive !== undefined) data.isActive = patch.isActive;

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Nothing to update" };
  }

  const updated = await queryWithRetry(async () => {
    return prisma.winTeamMember.update({ where: { id }, data });
  });
  return { ok: true, data: { member: toDTO(updated) } };
}

export async function rotateTeamToken(
  id: string
): Promise<ServiceResult<{ member: TeamMemberDTO; token: string }>> {
  const token = generateAccessToken();
  const updated = await queryWithRetry(async () => {
    return prisma.winTeamMember.update({
      where: { id },
      data: { tokenHash: hashAccessToken(token), tokenHint: tokenHint(token) },
    });
  });
  return { ok: true, data: { member: toDTO(updated), token } };
}

export async function deleteTeamMember(
  id: string
): Promise<ServiceResult<{ deleted: boolean }>> {
  await queryWithRetry(async () => {
    await prisma.winTeamMember.delete({ where: { id } });
  });
  return { ok: true, data: { deleted: true } };
}

export async function findTeamByToken(
  rawToken: string
): Promise<TeamMemberDTO | null> {
  const hash = hashAccessToken(rawToken);
  const found = await queryWithRetry(async () => {
    return prisma.winTeamMember.findUnique({ where: { tokenHash: hash } });
  });
  if (!found) return null;
  if (!found.isActive) return null;
  return toDTO(found);
}

export async function recordTeamLogin(id: string): Promise<void> {
  await queryWithRetry(async () => {
    await prisma.winTeamMember.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  });
}
