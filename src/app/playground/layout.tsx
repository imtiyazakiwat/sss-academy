import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DbProvider } from "@/components/playground/DbProvider";
import {
  PlaygroundThemeProvider,
  PlaygroundThemeScript,
} from "@/components/playground/PlaygroundTheme";

export const metadata: Metadata = {
  title: {
    default: "Interactive SQL & ETL Lab",
    template: "%s | Playground | SSS Academy",
  },
};

/**
 * One SQLite instance for the whole playground.
 *
 * The provider lives in the layout rather than in each page so that navigating
 * between labs keeps the database — including whatever a class has just done to
 * it. Losing a demonstration's state on a route change would make the ETL and
 * SCD labs useless back to back.
 */
export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return (
    <PlaygroundThemeProvider>
      <PlaygroundThemeScript />
      <DbProvider>{children}</DbProvider>
    </PlaygroundThemeProvider>
  );
}
