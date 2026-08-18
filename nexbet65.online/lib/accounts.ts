const AVATARS = ["#f6b01a", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981"];

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.]{3,20}$/.test(username);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function avatarFor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) | 0;
  return AVATARS[Math.abs(hash) % AVATARS.length];
}
