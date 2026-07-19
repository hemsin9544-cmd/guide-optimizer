import { useState } from "react";
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's projects (protected route - needs JWT)
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/projects");
      setProjects(response.data);
      return response.data as Project[];
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
      setProjects((prev) => [...prev, response.data as Project]);
      return response.data as Project;
    } catch (err) {
      console.error("Failed to create project:", err);
      throw err;
    }
  };

  return { projects, loading, fetchProjects, createProject };
}
