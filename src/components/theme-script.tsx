// src/components/theme-script.tsx
// Prevents flash of wrong theme (FART) before React hydrates.
// Uses next/script with strategy="beforeInteractive" to avoid React script tag warning.

import Script from "next/script";

export function ThemeScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('peopleos-theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
      }}
    />
  );
}
