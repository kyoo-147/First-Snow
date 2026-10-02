export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: "parent" | "admin" | "child";
};

export type ChildProfileSummary = {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  avatarUrl?: string;
  comfortStyle?: string;
};

export type AuthSessionData = {
  user?: AuthUser | null;
  child?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  isAuthenticated: boolean;
};

export type ApiErrorResponse = {
  error?: string;
  message?: string;
  statusCode?: number;
  details?: Record<string, string[]>;
};
