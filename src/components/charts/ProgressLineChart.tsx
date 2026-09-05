"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ProgressLineChart({
  data,
}: {
  data: { label: string; percentage: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v) => [`${v}%`, "Score"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="percentage"
          stroke="#4f46e5"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#4f46e5" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
