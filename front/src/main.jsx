import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import EditFile from "./pages/EditFile";
import DCPreview from "./pages/DCPreivew";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/EditFile",
    element: <EditFile />,
  },
  {
    path: "/DCPreview",
    element: <DCPreview />,
  }
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
