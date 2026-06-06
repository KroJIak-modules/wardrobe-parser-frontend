import { useEffect } from "react";

export function SiteApp() {
  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

  return (
    <main className="site-placeholder-shell">
      <p className="site-placeholder-copy">be monki</p>
    </main>
  );
}
