import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import CoverageView from "@/pages/CoveragePage";
import HomeView from "@/pages/SearchPage";
import AboutPage from "./pages/AboutPage";
import "./index.css";

const router = createHashRouter([
    {
        path: "/",
        element: <HomeView />
    },
    {
        path: "/about",
        element: <AboutPage />
    },
    {
        path: "/coverage",
        element: <CoverageView />
    }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
