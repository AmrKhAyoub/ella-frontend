"use client";

import { useEffect, useState, Suspense } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  CalendarIcon,
  Loader2,
} from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Mistake {
  id: number;
  wrong_text: string;
  corrected_text: string;
  category: "GRAMMAR" | "SPELLING" | "VOCABULARY" | "PUNCTUATION";
  explanation?: string;
  created_at: string;
}

const API_BASE_URL = "https://ella-v1.onrender.com";

const categoryConfig = {
  GRAMMAR: { label: "Grammar", color: "#2563eb" },
  SPELLING: { label: "Spelling", color: "#db2777" },
  VOCABULARY: { label: "Vocabulary", color: "#16a34a" },
  PUNCTUATION: { label: "Punctuation", color: "#d97706" },
} satisfies ChartConfig;

// 1. Rename your original component logic to a child component
function AnalyticsContent() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMistakes = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You must be logged in to view analytics.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/mistakes/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to load analytics data.");

        const data = await response.json();
        const mistakesList = Array.isArray(data) ? data : data.mistakes || [];
        setMistakes(mistakesList);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  const categoryCounts = mistakes.reduce(
    (acc: Record<string, number>, curr) => {
      const cat = curr.category || "GRAMMAR";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {}
  );

  const categoryChartData = Object.keys(categoryConfig).map((key) => ({
    category: categoryConfig[key as keyof typeof categoryConfig].label,
    count: categoryCounts[key] || 0,
    fill: categoryConfig[key as keyof typeof categoryConfig].color,
  }));

  const timelineCounts = mistakes.reduce(
    (acc: Record<string, number>, curr) => {
      const dateStr = new Date(curr.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    },
    {}
  );

  const timelineChartData = Object.keys(timelineCounts).map((date) => ({
    date,
    mistakes: timelineCounts[date],
  }));

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Learning Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your mistake patterns over time and review corrections from your
          tutor sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Mistakes by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                No data available yet.
              </div>
            ) : (
              <ChartContainer
                config={categoryConfig}
                className="min-h-[220px] w-full"
              >
                <BarChart accessibilityLayer data={categoryChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Mistakes Timeline (Improvement Trend)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                No timeline data available yet.
              </div>
            ) : (
              <ChartContainer
                config={{ mistakes: { label: "Mistakes", color: "#2563eb" } }}
                className="min-h-[220px] w-full"
              >
                <LineChart accessibilityLayer data={timelineChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="mistakes"
                    stroke="var(--color-mistakes)"
                    strokeWidth={2}
                    dot={true}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Recorded Mistakes Log
        </h2>

        {mistakes.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
            No mistakes recorded yet. Keep chatting with Ella to build your
            portfolio!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mistakes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 border rounded-lg bg-white dark:bg-zinc-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.category === "GRAMMAR"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : item.category === "SPELLING"
                        ? "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300"
                        : item.category === "VOCABULARY"
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1 p-3 rounded-md bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircleIcon className="h-3.5 w-3.5" /> Original
                      (Wrong)
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      &quot;{item.wrong_text}&quot;
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-3 rounded-md bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50">
                    <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2Icon className="h-3.5 w-3.5" /> Corrected
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      &quot;{item.corrected_text}&quot;
                    </p>
                  </div>
                </div>

                {item.explanation && (
                  <div className="flex gap-2 items-start pt-2 border-t text-xs text-muted-foreground">
                    <BookOpenIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Explanation: </strong>
                      {item.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Export a wrapper component that renders the content inside <Suspense>
export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading analytics...
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}