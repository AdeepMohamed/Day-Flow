// src/components/peopleos-logo.tsx
// SVG logo component — custom PeopleOS brand mark

interface PeopleOSLogoProps {
  size?: number;
  className?: string;
}

export function PeopleOSLogo({ size = 40, className }: PeopleOSLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PeopleOS logo"
    >
      {/* Background circle */}
      <circle cx="24" cy="24" r="24" fill="#4F46E5" />

      {/* Outer orbital ring */}
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
        strokeDasharray="4 2"
      />

      {/* Inner ring */}
      <circle
        cx="24"
        cy="24"
        r="12"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        fill="none"
      />

      {/* Center person icon */}
      {/* Head */}
      <circle cx="24" cy="20" r="4" fill="white" />
      {/* Body */}
      <path
        d="M15 34c0-4.97 4.03-9 9-9s9 4.03 9 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Orbital dots */}
      <circle cx="24" cy="6" r="2.5" fill="white" fillOpacity="0.7" />
      <circle cx="42" cy="24" r="2.5" fill="#A5B4FC" fillOpacity="0.8" />
      <circle cx="6" cy="24" r="2.5" fill="#A5B4FC" fillOpacity="0.8" />
      <circle cx="38.97" cy="9.03" r="1.75" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

// Text logo for sidebar
export function PeopleOSWordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <PeopleOSLogo size={36} />
      <div>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          PeopleOS
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "rgba(148, 163, 184, 0.9)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          HR Platform
        </div>
      </div>
    </div>
  );
}
