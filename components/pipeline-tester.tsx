"use client";

import { useState } from "react";
import { runTimedLocationTest } from "@/components/locationtest";

export function PipelineTester() {
  const [isRunning, setIsRunning] = useState(false);

  const handleStartTest = async () => {
    setIsRunning(true);

    try {
      await runTimedLocationTest();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded border border-zinc-200 bg-zinc-900 p-4 text-white">
      <h3 className="mb-2 text-sm font-bold">Pipeline Tester</h3>
      <button
        onClick={handleStartTest}
        disabled={isRunning}
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isRunning ? "Running..." : "Start 30s Dual-Location Test"}
      </button>
    </div>
  );
}
