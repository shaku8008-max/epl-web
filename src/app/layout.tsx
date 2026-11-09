import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono } from "next/font/google";
import "./globals.css";
import HomeLogo from "@/components/HomeLogo";
import Tabs from "@/components/Tabs";
import ModelStack, { type ModelStackItem } from "@/components/ModelStack";
import { getLatestRun, getTrackRecord } from "@/lib/data";
import { formatMelbourne } from "@/lib/format";
import { sortModelsByWinRate, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

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

async function loadTrackRecord(): Promise<TrackRecord[] | null> {
  try {
    return await getTrackRecord();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Footer data. getLatestRun() returns null instead of throwing, so a failed
  // query cannot take down every page (see /status for troubleshooting).
  const run = await getLatestRun();
  const trackRecord = await loadTrackRecord();
  const modelStack: ModelStackItem[] = sortModelsByWinRate(trackedModels, trackRecord ?? []).map((model) => {
    const rows = trackRecord?.filter((row) => row.model_key === model.key) ?? [];
    const correct = rows.filter((row) => row.correct === true).length;
    const line =
      trackRecord === null
        ? "Record unavailable"
        : rows.length === 0
          ? "Collecting, 0 matches scored"
          : `${correct} of ${rows.length} correct (${Math.round((correct / rows.length) * 100)}%)`;

    return {
      modelKey: model.key,
      name: model.label,
      href: model.key === "lean" ? "/lean" : model.key === "nn" ? "/neural" : "/goals",
      line,
    };
  });

  return (
    <html
      lang="en-AU"
      className={`${archivo.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col overflow-x-clip bg-surface font-body text-ink">
        <ModelStack models={modelStack} />
        <header className="border-b border-edge bg-white text-ink">
          <div className="mx-auto flex min-h-16 w-full max-w-4xl flex-col items-stretch gap-0 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6">
            <HomeLogo />
            <Tabs />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-edge bg-tint">
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
