import React from "react";
import ReactDOM from "react-dom/client";
import "../../src/styles.css";

import { AdminApp } from "../../src/admin/admin-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
