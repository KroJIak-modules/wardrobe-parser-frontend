import React from "react";
import ReactDOM from "react-dom/client";
import "../../src/site/app/site-global.css";

import { SiteApp } from "../../src/site/app/site-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SiteApp />
  </React.StrictMode>
);
