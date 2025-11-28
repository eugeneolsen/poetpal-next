import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poet's Pal",
  description: "Rhyming dictionary and thesaurus powered by Datamuse",
};

export default function RootLayout(
  props: Readonly<{ children: React.ReactNode }>
) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Satisfy&family=Yellowtail&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-slate-900">
        {props.children}
      </body>
    </html>
  );
}
