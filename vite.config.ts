import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";
import path from "path";

// https://tanstack.com/start/latest/docs/framework/react/guide/hosting
export default defineConfig(({command}) => ({
    ssr: command === 'build' ? {noExternal: true} : undefined,
    plugins: [
        tanstackStart({
            router: {codeSplittingOptions: {defaultBehavior: []}},
            prerender: {
                enabled: true,
                failOnError: false,
            },
        }),
        react(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    // Start не пребандлит свои пакеты, и в dev роутер грузился ~120
    // отдельными модулями: долго на плохой сети, и любой сорванный запрос
    // ронял гидрацию. Библиотеки роутера (без виртуальных импортов Start)
    // собираем в .vite/deps — один экземпляр и для кода приложения, и для
    // сырых модулей Start.
    optimizeDeps: {
        include: [
            "@tanstack/react-router",
            "@tanstack/router-core",
            "@tanstack/router-core/isServer",
            "@tanstack/router-core/ssr/client",
            "@tanstack/history",
            "@tanstack/react-store",
            "seroval",
            "seroval-plugins/web",
            "cookie-es",
        ],
    },
    server: {
        // Маршруты преобразуются на старте vite, а не на первом заходе в превью.
        warmup: {
            clientFiles: ["./src/routes/**/*.tsx", "./src/router.tsx"],
            ssrFiles: ["./src/routes/**/*.tsx", "./src/router.tsx"],
        },
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: true,
        hmr: {
            overlay: false,
            timeout: 7000, // pingInterval @vite/client — нужен <30s для DDoS Guard
        }
    },
}));
