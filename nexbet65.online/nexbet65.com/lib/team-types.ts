export type TeamRole = "super_admin" | "moderator" | "operator";

export type TeamPermission =
  | "team" // manage team members (super admins)
  | "payments" // view + review payment requests
  | "aviator-server" // realtime Aviator server logs
  | "wheel-server" // realtime Money Wheel server logs
  | "mines-server" // active Mines round state (in-process)
  | "p2p"; // P2P agent overview + float top-up approval

export const TEAM_ROLES: TeamRole[] = ["super_admin", "moderator", "operator"];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  super_admin: "Super Admin",
  moderator: "Moderator",
  operator: "Operator",
};

export const TEAM_ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  super_admin: "Full access: manage team, review payments, view server logs.",
  moderator: "Monitor and review payment requests.",
  operator: "View realtime game-server logs.",
};

export const TEAM_PERMISSIONS: { id: TeamPermission; label: string; hint: string }[] = [
  { id: "team", label: "Team management", hint: "Add / edit / remove team members" },
  { id: "payments", label: "Payments", hint: "View + approve / reject requests" },
  { id: "aviator-server", label: "Aviator server", hint: "Realtime Aviator logs" },
  { id: "wheel-server", label: "Money Wheel server", hint: "Realtime Money Wheel logs" },
  { id: "mines-server", label: "Mines server", hint: "Realtime Mines logs" },
  { id: "p2p", label: "P2P agents", hint: "P2P overview + float top-up approval" },
];

export const TEAM_PERMISSION_LABELS: Record<TeamPermission, string> = {
  team: "Team",
  payments: "Payments",
  "aviator-server": "Aviator server",
  "wheel-server": "Money Wheel server",
  "mines-server": "Mines server",
  p2p: "P2P agents",
};

/** Default permission set for each role (editable per member). */
export const ROLE_DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermission[]> = {
  super_admin: ["team", "payments", "aviator-server", "wheel-server", "mines-server", "p2p"],
  moderator: ["payments"],
  operator: ["aviator-server", "wheel-server", "mines-server"],
};

export interface TeamMemberDTO {
  id: string;
  name: string;
  role: TeamRole;
  permissions: TeamPermission[];
  tokenHint: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdBy: string;
  createdAt: string;
}
