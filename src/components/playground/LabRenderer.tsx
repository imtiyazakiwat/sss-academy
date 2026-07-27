"use client";

import { ChallengeLab } from "@/components/playground/labs/ChallengeLab";
import { EtlPipelineLab } from "@/components/playground/labs/EtlPipelineLab";
import { InterviewLab } from "@/components/playground/labs/InterviewLab";
import { QueryLab } from "@/components/playground/labs/QueryLab";
import { SchemaLab } from "@/components/playground/labs/SchemaLab";
import { ScdLab } from "@/components/playground/labs/ScdLab";
import { ValidationLab } from "@/components/playground/labs/ValidationLab";
import type { Lab } from "@/content/labs";

/**
 * Maps a lab's `kind` to its module. Every branch is exhaustive over `LabKind`,
 * so adding a kind without a component is a type error rather than a blank page.
 */
export function LabRenderer({ lab }: { lab: Lab }) {
  switch (lab.kind) {
    case "query":
      return <QueryLab lab={lab} />;
    case "etl-pipeline":
      return <EtlPipelineLab lab={lab} />;
    case "validation":
      return <ValidationLab lab={lab} />;
    case "scd":
      return <ScdLab lab={lab} />;
    case "schema":
      return <SchemaLab lab={lab} />;
    case "challenges":
      return <ChallengeLab lab={lab} />;
    case "interview":
      return <InterviewLab lab={lab} />;
    default: {
      const exhaustive: never = lab.kind;
      throw new Error(`No component registered for lab kind "${String(exhaustive)}".`);
    }
  }
}
