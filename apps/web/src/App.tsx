import { Button } from "@/components/ui/button";
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50">
      <h1 className="text-4xl font-bold text-zinc-900">Guide Optimizer</h1>
      <p className="text-zinc-600">React 19 + Vite + TypeScript + Tailwind</p>

      <div className="flex gap-2">
        <Button onClick={() => setCount((c) => c + 1)}>Count: {count}</Button>
        <Button variant="outline" onClick={() => setCount(0)}>
          Reset
        </Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </div>
    </div>
  );
}

export default App;
