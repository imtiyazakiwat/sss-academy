"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  buildCompletions,
  filterCompletions,
  formatSql,
  inLiteralOrComment,
  tokenize,
  wordBeforeCaret,
  type Completion,
  type TokenKind,
} from "@/lib/sql-lang";
import { cn } from "@/lib/cn";

/**
 * Token colours come from the theme's syntax scale rather than the palette, so
 * one attribute flip re-colours the editor and every hue stays contrast-checked
 * against its own surface.
 */
const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-[var(--pg-syn-keyword)]",
  type: "text-[var(--pg-syn-type)]",
  function: "text-[var(--pg-syn-function)]",
  string: "text-[var(--pg-syn-string)]",
  number: "text-[var(--pg-syn-number)]",
  comment: "text-[var(--pg-syn-comment)] italic",
  operator: "text-[var(--pg-syn-operator)]",
  punctuation: "text-[var(--pg-syn-punctuation)]",
  identifier: "text-[var(--pg-syn-identifier)]",
  whitespace: "",
};

const PAD_X = 14;
const PAD_Y = 12;
const LINE_HEIGHT = 22;
const GUTTER = 44;

export interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Cmd/Ctrl+Enter, and the Run button. */
  onRun: () => void;
  /** table -> columns, for autocomplete. */
  schema?: Record<string, string[]>;
  rows?: number;
  running?: boolean;
  runLabel?: string;
  /** Extra controls rendered in the toolbar, right of Format. */
  actions?: ReactNode;
  label?: string;
  /** Fills the parent's height instead of sizing to `rows`. For pane use. */
  fill?: boolean;
  /** Draws the eye to Run — used when an example was loaded but not executed. */
  pulseRun?: boolean;
  className?: string;
}

/**
 * SQL editor: syntax highlighting, line numbers, schema-aware autocomplete,
 * a formatter and keyboard shortcuts.
 *
 * The highlight layer is a `<pre>` sitting directly beneath a transparent
 * `<textarea>`. Both use identical metrics, so the browser's own text layout
 * keeps them aligned and the native caret, selection, undo stack, spellcheck
 * suppression and mobile keyboard all keep working — none of which a
 * contenteditable or canvas-based editor gets for free.
 */
export function SqlEditor({
  value,
  onChange,
  onRun,
  schema = {},
  rows = 10,
  running = false,
  runLabel = "Execute",
  actions,
  label = "SQL editor",
  fill = false,
  pulseRun = false,
  className,
}: SqlEditorProps) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);

  const [charWidth, setCharWidth] = useState(7.8);
  const [caret, setCaret] = useState(0);
  const [suggestions, setSuggestions] = useState<Completion[]>([]);
  const [active, setActive] = useState(0);

  const completions = useMemo(() => buildCompletions(schema), [schema]);
  const tokens = useMemo(() => tokenize(value), [value]);
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  // Measure the monospace advance width once, so the popup can be positioned at
  // the caret without a DOM measurement per keystroke.
  useLayoutEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const width = ruler.getBoundingClientRect().width / 40;
    if (width > 0) setCharWidth(width);
  }, []);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (preRef.current) {
      preRef.current.scrollTop = textarea.scrollTop;
      preRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  }, []);

  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setActive(0);
  }, []);

  const refreshSuggestions = useCallback(
    (nextValue: string, nextCaret: number) => {
      if (inLiteralOrComment(nextValue, nextCaret)) {
        closeSuggestions();
        return;
      }
      const prefix = wordBeforeCaret(nextValue, nextCaret);
      if (prefix.length < 2) {
        closeSuggestions();
        return;
      }
      const matches = filterCompletions(completions, prefix);
      setSuggestions(matches);
      setActive(0);
    },
    [completions, closeSuggestions],
  );

  const handleChange = (next: string, nextCaret: number) => {
    onChange(next);
    setCaret(nextCaret);
    refreshSuggestions(next, nextCaret);
  };

  /** Writes through the textarea so the browser keeps one undo entry. */
  const replaceRange = (start: number, end: number, text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    // setRangeText preserves the native undo stack; string surgery does not.
    textarea.setRangeText(text, start, end, "end");
    const next = textarea.value;
    onChange(next);
    setCaret(textarea.selectionStart);
    return next;
  };

  const accept = (completion: Completion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const position = textarea.selectionStart;
    const prefix = wordBeforeCaret(textarea.value, position);
    const start = position - prefix.length;

    if (completion.label.endsWith("(")) {
      replaceRange(start, position, `${completion.label})`);
      const inside = start + completion.label.length;
      requestAnimationFrame(() => textarea.setSelectionRange(inside, inside));
    } else {
      replaceRange(start, position, completion.label);
    }
    closeSuggestions();
  };

  const format = () => {
    const formatted = formatSql(value);
    if (formatted !== value) {
      replaceRange(0, value.length, formatted);
    }
    closeSuggestions();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const open = suggestions.length > 0;

    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      closeSuggestions();
      onRun();
      return;
    }

    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      format();
      return;
    }

    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        accept(suggestions[active]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSuggestions();
        return;
      }
    }

    if (event.key === "Tab") {
      // Trapping Tab is normally an accessibility problem; Escape first closes
      // the popup, and Shift+Tab still leaves the field, so there is always a
      // keyboard route out.
      if (event.shiftKey) return;
      event.preventDefault();
      const { selectionStart, selectionEnd } = textarea;
      replaceRange(selectionStart, selectionEnd, "  ");
      return;
    }

    if (event.key === "Escape") {
      closeSuggestions();
    }
  };

  // Caret coordinates for the popup, derived from the text itself.
  const before = value.slice(0, caret);
  const caretLine = before.split("\n").length - 1;
  const caretColumn = before.length - (before.lastIndexOf("\n") + 1);
  const prefixLength = wordBeforeCaret(value, caret).length;

  const popupLeft = Math.max(
    GUTTER + PAD_X,
    GUTTER + PAD_X + (caretColumn - prefixLength) * charWidth,
  );
  const popupTop = PAD_Y + (caretLine + 1) * LINE_HEIGHT + 4;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-pg-line bg-pg-surface",
        fill && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div className={cn("relative", fill && "min-h-0 flex-1")}>
        {/* Ruler: 40 zeroes, measured once to get the advance width. */}
        <span
          ref={rulerRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute font-mono text-[13px]"
        >
          0000000000000000000000000000000000000000
        </span>

        <div
          ref={gutterRef}
          aria-hidden="true"
          className="hide-scrollbar absolute inset-y-0 left-0 overflow-hidden border-r border-pg-line bg-pg-raised text-right font-mono text-[13px] text-pg-faint select-none"
          style={{ width: GUTTER, paddingTop: PAD_Y, paddingBottom: PAD_Y }}
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} style={{ height: LINE_HEIGHT, paddingRight: 10 }}>
              {index + 1}
            </div>
          ))}
        </div>

        <pre
          ref={preRef}
          aria-hidden="true"
          className="hide-scrollbar pointer-events-none absolute inset-0 overflow-hidden font-mono text-[13px] whitespace-pre"
          style={{
            paddingTop: PAD_Y,
            paddingBottom: PAD_Y,
            paddingLeft: GUTTER + PAD_X,
            paddingRight: PAD_X,
            lineHeight: `${LINE_HEIGHT}px`,
            tabSize: 2,
          }}
        >
          {tokens.map((token, index) => (
            <span key={index} className={TOKEN_CLASS[token.kind]}>
              {token.value}
            </span>
          ))}
          {"\n"}
        </pre>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) =>
            handleChange(event.target.value, event.target.selectionStart)
          }
          onKeyDown={onKeyDown}
          onKeyUp={(event) => setCaret(event.currentTarget.selectionStart)}
          onClick={(event) => {
            setCaret(event.currentTarget.selectionStart);
            closeSuggestions();
          }}
          onBlur={closeSuggestions}
          onScroll={syncScroll}
          rows={fill ? undefined : rows}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          aria-label={label}
          aria-autocomplete="list"
          aria-describedby={`${editorId}-hint`}
          className={cn(
            "block w-full resize-none bg-transparent font-mono text-[13px] text-transparent caret-[var(--pg-caret)] outline-none selection:bg-[var(--pg-selection)]",
            fill ? "absolute inset-0 h-full" : "relative",
          )}
          style={{
            paddingTop: PAD_Y,
            paddingBottom: PAD_Y,
            paddingLeft: GUTTER + PAD_X,
            paddingRight: PAD_X,
            lineHeight: `${LINE_HEIGHT}px`,
            tabSize: 2,
            whiteSpace: "pre",
            overflowX: "auto",
          }}
        />

        <p id={`${editorId}-hint`} className="sr-only">
          SQL editor. Press Command or Control plus Enter to execute. Suggestions
          appear as you type; use the arrow keys to choose one and Enter or Tab to
          insert it, or Escape to dismiss.
        </p>
        <p aria-live="polite" className="sr-only">
          {suggestions.length > 0
            ? `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} available. ${suggestions[active]?.label ?? ""} highlighted.`
            : ""}
        </p>

        {suggestions.length > 0 ? (
          <ul
            role="listbox"
            aria-label="SQL suggestions"
            className="pg-scroll animate-pg-fade-in absolute z-20 max-h-60 w-64 overflow-auto rounded-xl border border-pg-line-strong bg-pg-raised py-1 shadow-lift"
            style={{ left: popupLeft, top: popupTop }}
          >
            {suggestions.map((item, index) => (
              <li key={`${item.kind}-${item.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  // The textarea must keep focus, so accept on mousedown.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    accept(item);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left font-mono text-xs transition-colors",
                    index === active
                      ? "bg-pg-primary-soft text-pg-text"
                      : "text-pg-dim hover:bg-pg-hover",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 text-[0.6875rem] text-pg-faint">
                    {item.detail}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-pg-line bg-pg-raised px-3 py-2.5">
        <button
          type="button"
          onClick={() => {
            closeSuggestions();
            onRun();
          }}
          disabled={running}
          className={cn(
            "group inline-flex h-8 items-center gap-1.5 rounded-full bg-pg-primary px-3.5 text-[0.8125rem] font-medium text-pg-on-primary transition-[background-color,transform,box-shadow] duration-200 hover:bg-pg-primary-hover active:translate-y-px disabled:opacity-55",
            pulseRun && "animate-pg-nudge",
          )}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
            <path d="M4 2.5 12.5 8 4 13.5Z" fill="currentColor" />
          </svg>
          {running ? "Running…" : runLabel}
        </button>

        <button
          type="button"
          onClick={format}
          className="inline-flex h-8 items-center rounded-full border border-pg-line px-3 text-[0.8125rem] font-medium text-pg-dim transition-colors hover:border-pg-line-strong hover:text-pg-text"
        >
          Format
        </button>

        {actions}

        <p className="ml-auto hidden font-mono text-[0.6875rem] text-pg-faint sm:block">
          ⌘↵ run · ⇧⌥F format · ln {caretLine + 1}, col {caretColumn + 1}
        </p>
      </div>
    </div>
  );
}
