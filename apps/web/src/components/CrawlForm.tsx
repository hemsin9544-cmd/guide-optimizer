import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface CrawlFormProps {
  onCrawlStarted: (jobId: string) => void;
}

export function CrawlForm({ onCrawlStarted }: CrawlFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/crawl", { url });
      onCrawlStarted(response.data.jobId);
      setUrl("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start crawl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Enter URL to analyze (e.g., https://example.com)"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          required
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Crawling..." : "Analyze"}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
