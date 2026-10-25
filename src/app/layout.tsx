import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono } from "next/font/google";
import "./globals.css";
import PitchIcon from "@/components/PitchIcon";
import Tabs from "@/components/Tabs";
import { getLatestRun } from "@/lib/data";
import { formatMelbourne } from "@/lib/format";

// Load fonts with next/font (no external stylesheet). Archivo is shared by
// headings and body copy; DM Mono is reserved for compact data values.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: "400",
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

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Footer data. getLatestRun() returns null instead of throwing, so a failed
  // query cannot take down every page (see /status for troubleshooting).
  const run = await getLatestRun();

  return (
    <html
      lang="en-AU"
      className={`${archivo.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-surface font-body text-ink">
        <header className="border-b border-border bg-white text-ink">
          <div className="mx-auto flex min-h-16 w-full max-w-4xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
            <div className="flex min-w-0 shrink items-center gap-1.5">
              <PitchIcon className="h-6 w-6 shrink-0 text-accent" />
              <span className="whitespace-nowrap font-heading text-xl font-bold tracking-tight sm:text-2xl">
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
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-base text-muted sm:px-6">
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
