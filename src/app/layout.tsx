import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import PitchIcon from "@/components/PitchIcon";
import Tabs from "@/components/Tabs";
import { getLatestRun } from "@/lib/data";
import { formatMelbourne } from "@/lib/format";

// Load fonts with next/font (no external stylesheet). Both fonts are variable
// fonts, so no weight list is needed. The .variable properties put the two
// CSS custom properties on <html>, where the tokens in globals.css pick them up.
const headingFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EPL Predictor",
    template: "%s · EPL Predictor",
  },
  description: "Premier League match predictions from recent form and xG.",
  openGraph: {
    title: "EPL Predictor",
    description: "Premier League match predictions from recent form and xG.",
  },
};

// Green browser chrome on mobile (viewport export is where themeColor lives).
export const viewport: Viewport = {
  themeColor: "#166534",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Footer data. getLatestRun() returns null instead of throwing, so a failed
  // query cannot take down every page (see /status for troubleshooting).
  const run = await getLatestRun();

  return (
    <html
      lang="en-AU"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-surface font-body text-ink">
        <header className="bg-gradient-to-b from-primary-light to-primary text-white shadow-sm">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <PitchIcon className="h-7 w-7" />
              <span className="font-heading text-xl font-bold tracking-tight">
                EPL Predictor
              </span>
            </div>
            <Tabs />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-border bg-tint">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted sm:px-6">
            <p>
              <span className="font-medium text-ink">Data as of:</span>{" "}
              {run
                ? `${formatMelbourne(run.data_as_of)} · model ${run.model_version}`
                : "unavailable"}
            </p>
            <p>For fun only. Not betting advice.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
