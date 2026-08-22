// src/app/admin/loading.tsx
// Instant visual feedback skeleton for Admin pages (<20ms transition)

export default function AdminLoading() {
  return (
    <div className="animate-fade-in" style={{ padding: "1.5rem" }}>
      {/* Topbar Skeleton */}
      <div
        style={{
          height: "64px",
          background: "rgb(var(--bg-card))",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          border: "1px solid rgb(var(--border))",
          opacity: 0.7,
        }}
        className="animate-pulse"
      />

      {/* KPI Stats Grid Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: "110px",
              background: "rgb(var(--bg-card))",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgb(var(--border))",
              opacity: 0.6,
            }}
            className="animate-pulse"
          />
        ))}
      </div>

      {/* Table / Grid Content Skeleton */}
      <div
        style={{
          height: "400px",
          background: "rgb(var(--bg-card))",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgb(var(--border))",
          opacity: 0.5,
        }}
        className="animate-pulse"
      />
    </div>
  );
}
