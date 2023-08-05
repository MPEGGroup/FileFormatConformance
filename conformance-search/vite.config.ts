/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig, splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    base: "/FileFormatConformance",
    plugins: [react(), splitVendorChunkPlugin()],
    resolve: {
        alias: {
            "@": "/src",
            "@data": "/data"
        }
    },
    build: {
        chunkSizeWarningLimit: 500
    },
    define: {
        BUILD_TIMESTAMP: JSON.stringify(new Date().toISOString()),
        MP4BOX_BASE: JSON.stringify("https://gpac.github.io/mp4box.js/test/filereader.html")
    },
    test: {
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        coverage: {
            all: true,
            provider: "v8",
            exclude: [
                "**/node_modules/**",
                "**/*.config.*",
                "**/dist/**/*",
                "**/*.d.ts",
                "**/tests/**/*",
                "**/*.spec.ts",
                "**/types/**/*",
                "src/main.tsx"
            ]
        }
    }
});
