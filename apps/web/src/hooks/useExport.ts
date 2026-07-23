import { useState } from "react";
import { api } from "@/lib/api";

export function useExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exportJob = async (
    jobId: string,
    format: "markdown" | "html" | "docx" | "pdf",
  ) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/export/${jobId}`, {
        params: { format },
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export.${format}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Export failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { exportJob, loading, error };
}
