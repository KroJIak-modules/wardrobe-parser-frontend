import React from "react";
import ReactDOM from "react-dom/client";
import "../../src/site/site.css";

import { SiteApp } from "../../src/site/site-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SiteApp />
  </React.StrictMode>
);
