import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function CrawlHistory() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/api/crawl/history");
      setJobs(response.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      RUNNING: "bg-blue-100 text-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-zinc-100 text-zinc-800";
  };

  if (loading) return <p className="text-zinc-500">Loading history...</p>;

  return (
    <div className="w-full">
      <h3 className="font-semibold text-lg mb-4">Crawl History</h3>
      {jobs.length === 0 ? (
        <p className="text-zinc-400 text-center py-8">No crawls yet</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-zinc-50">
              <div>
                <p className="font-medium text-sm">{job.title}</p>
                <p className="text-xs text-zinc-400">{new Date(job.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {job.analyses[0]?.score !== null && (
                  <span className="text-sm font-medium text-zinc-600">Score: {job.analyses[0].score}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}