"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLOR = (v: number) => {
  if (v >= 85) return "#10b981";
  if (v >= 70) return "#38bdf8";
  if (v >= 55) return "#f59e0b";
  return "#f43f5e";
};

export default function TopicBarChart({
  data,
}: {
  data: { name: string; averagePct: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12, fill: "#334155" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`${v}%`, "Average"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Bar dataKey="averagePct" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={COLOR(d.averagePct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
