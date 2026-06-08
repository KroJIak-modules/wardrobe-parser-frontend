import { useEffect } from "react";
import { SiteHomePage } from "./site-home-page";

export function SiteApp() {
  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

  return <SiteHomePage />;
}
