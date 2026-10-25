import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import MobileNav from "@/components/site/MobileNav";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";

const TITLE = "Клевер — гостевые квартиры посуточно, прямая бронь";
const DESCRIPTION =
    "Уютные квартиры посуточно у метро: мгновенная бронь без комиссий, бесконтактное заселение 24/7 и честная цена.";
const OG_IMAGE = "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/536e6dcc-fdf3-40e9-beef-eb0388c4a8d6.jpg";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "1360"},
            {property: "og:image:height", content: "768"},
            {name: "twitter:image", content: OG_IMAGE},
        ],
        links: [
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500&family=Manrope:wght@300;400;500;600&display=swap",
            },
            {rel: "stylesheet", href: appCss},
            {
                rel: "icon",
                type: "image/svg+xml",
                href: `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}favicon.svg`,
            },
        ],
        scripts: [],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <RootDocument>
            <TooltipProvider>
                <Toaster/>
                <Sonner/>
                <Outlet/>
                <MobileNav/>
            </TooltipProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
