// src/app/admin/loading.tsx
// Sleek, non-disruptive top loading bar for smooth admin page transitions

export default function AdminLoading() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <div
        className="animate-pulse"
        style={{
          height: "3px",
          width: "100%",
          background: "linear-gradient(90deg, rgb(var(--accent)) 0%, #a855f7 50%, rgb(var(--accent)) 100%)",
        }}
      />
    </div>
  );
}
