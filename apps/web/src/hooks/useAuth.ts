import { useState } from "react";
import { api } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Register a new user
  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        name,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      return { token, user };
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current user (protected route)
  const getMe = async () => {
    try {
      const response = await api.get("/api/me");
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return { user, loading, error, register, login, getMe, logout };
}
