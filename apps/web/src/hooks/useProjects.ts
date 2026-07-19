import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's projects (protected route - needs JWT)
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/projects");
      setProjects(response.data);
      return response.data;
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (name: string, description?: string) => {
    try {
      const response = await api.post("/api/projects", { name, description });
      setProjects((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error("Failed to create project:", err);
      throw err;
    }
  };

  return { projects, loading, fetchProjects, createProject };
}
