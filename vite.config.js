import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/meditation-timer/",
    build: { sourcemap: false },
    plugins: [react()],
});