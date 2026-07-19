import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CrawlForm } from "@/components/CrawlForm";
import { CrawlStatus } from "@/components/CrawlStatus";
import { CrawlHistory } from "@/components/CrawlHistory";

function App() {
  const { user, loading, error, register, login, logout } = useAuth();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(email, password, name);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleCrawlStarted = (jobId: string) => {
    setActiveJobId(jobId);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Guide Optimizer</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600">{user.name || user.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!user ? (
          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
            <div className="flex-1 max-w-md bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Create Account</h2>
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg px-4 py-2" required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg px-4 py-2" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded-lg px-4 py-2" required />
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</Button>
              </form>
            </div>

            <div className="flex-1 max-w-md bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Sign In</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg px-4 py-2" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded-lg px-4 py-2" required />
                <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Analyze a Webpage</h2>
              <CrawlForm onCrawlStarted={handleCrawlStarted} />
            </div>

            {activeJobId && <CrawlStatus jobId={activeJobId} />}

            <Button variant="ghost" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Hide" : "Show"} Crawl History
            </Button>

            {showHistory && <CrawlHistory />}
          </div>
        )}

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </main>
    </div>
  );
}

export default App;
