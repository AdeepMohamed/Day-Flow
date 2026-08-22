// src/components/theme-script.tsx
// Inline script to prevent flash of wrong theme on page load

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('peopleos-theme');
        if (!theme) {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
