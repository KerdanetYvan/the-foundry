export type UserRole = "admin" | "player";

export type User = {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  whitelisted: boolean;
  invitationId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Invitation = {
  id: number;
  token: string;
  maxUses: number;
  useCount: number;
  expiresAt: Date;
  createdAt: Date;
};
