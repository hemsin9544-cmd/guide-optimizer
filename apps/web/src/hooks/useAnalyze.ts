import { useState } from "react";
import { api } from "@/lib/api";

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (
    jobId: string,
    type: string = "SEO",
    provider: string = "gemini",
  ) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`/api/analyze/${jobId}`, {
        type,
        provider,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Analysis failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error };
}
