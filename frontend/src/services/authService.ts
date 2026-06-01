import API_BASE_URL from "../api";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  department: string | null;
  role: "Admin" | "Agent" | "User";
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  localStorage.setItem("token", result.token);
  localStorage.setItem("user", JSON.stringify(result.user));

  return result;
}

export function getCurrentUser(): AuthUser | null {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  return JSON.parse(user) as AuthUser;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function logoutUser(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}