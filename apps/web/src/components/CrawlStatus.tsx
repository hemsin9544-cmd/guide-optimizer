import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAnalyze } from "@/hooks/useAnalyze";
import { useExport } from "@/hooks/useExport";

interface CrawlStatusProps {
  jobId: string;
}

export function CrawlStatus({ jobId }: CrawlStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  const { analyze, loading: analyzing, error: analyzeError } = useAnalyze();
  const { exportJob, loading: exporting } = useExport();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get(`/api/crawl/${jobId}/status`);
        setStatus(response.data);
        setLoading(false);

        if (
          response.data.status === "PENDING" ||
          response.data.status === "RUNNING"
        ) {
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error("Failed to check status:", err);
        setLoading(false);
      }
    };

    checkStatus();
  }, [jobId]);

  const handleAnalyze = async () => {
    try {
      const result = await analyze(jobId, "SEO", "gemini");
      setAnalysis(result.result);
    } catch {
      // error already captured in analyzeError
    }
  };

  const handleExport = async (format: "markdown" | "html" | "docx" | "pdf") => {
    try {
      await exportJob(jobId, format);
    } catch {
      // error already captured in useExport
    }
  };

  if (loading) return <p className="text-zinc-500">Checking status...</p>;
  if (!status) return <p className="text-red-500">Job not found</p>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      case "RUNNING":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="border rounded-lg p-4 w-full bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">{status.title}</h3>
        <span className={`font-medium ${getStatusColor(status.status)}`}>
          {status.status}
        </span>
      </div>

      {status.status === "RUNNING" && (
        <div className="w-full bg-zinc-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full animate-pulse"
            style={{ width: "60%" }}
          />
        </div>
      )}

      {status.result && (
        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-zinc-50 p-3 rounded">
              <p className="text-zinc-500">Word Count</p>
              <p className="text-xl font-bold">{status.result.wordCount}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded">
              <p className="text-zinc-500">Read Time</p>
              <p className="text-xl font-bold">
                {status.result.readTimeMinutes}m
              </p>
            </div>
            <div className="bg-zinc-50 p-3 rounded">
              <p className="text-zinc-500">Headings</p>
              <p className="text-xl font-bold">
                {status.result.headings?.length || 0}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Meta Description</h4>
            <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded">
              {status.result.metaDescription || "No meta description found"}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Headings Structure</h4>
            <div className="space-y-1">
              {status.result.headings?.map((h: any, i: number) => (
                <p
                  key={i}
                  className="text-sm"
                  style={{ paddingLeft: `${(h.level - 1) * 16}px` }}
                >
                  <span className="text-zinc-400">H{h.level}</span>{" "}
                  <span className="text-zinc-700">{h.text}</span>
                </p>
              ))}
            </div>
          </div>

          {/* AI Analysis section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">AI Analysis</h4>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </Button>
            </div>
            {analyzeError && (
              <p className="text-red-500 text-sm">{analyzeError}</p>
            )}
            {analysis && (
              <div className="bg-zinc-50 p-3 rounded space-y-2">
                <p className="font-semibold">Score: {analysis.score}/100</p>
                <p className="text-sm text-zinc-600">{analysis.summary}</p>
                {analysis.suggestions?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-zinc-700 space-y-1">
                    {analysis.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Export section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Export</h4>
            <div className="flex gap-2 flex-wrap">
              {(["markdown", "html", "docx", "pdf"] as const).map((format) => (
                <Button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={exporting}
                  variant="outline"
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
