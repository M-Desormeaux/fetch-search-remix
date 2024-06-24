import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import type { MetaFunction } from "@vercel/remix";

import "./tailwind.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Doggy Dream Home" },
    {
      property: "og:title",
      content: "Doggy Dream Home",
    },
    {
      name: "description",
      content: "A place for dogs to find their furever owners.",
    },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="mx-auto max-w-7xl">{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
