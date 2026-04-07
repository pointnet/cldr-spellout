import { useEffect, useRef, useState } from "react";
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import styles from "./styles.module.css";

// ── helpers ──────────────────────────────────────────────────────────────────

const ALL_LOCALES = RuleBasedNumberFormat.getSupportedLocales();

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "language" });
} catch {
  // Intl.DisplayNames not available
}

function localeLabel(tag: string): string {
  const name = displayNames?.of(tag);
  return name && name !== tag ? `${tag} — ${name}` : tag;
}

const SUPPORTED_SET = new Set(ALL_LOCALES);

function detectLocale(): string {
  const candidates = navigator?.languages ?? (navigator?.language ? [navigator.language] : []);
  for (const raw of candidates) {
    if (SUPPORTED_SET.has(raw)) return raw;
    // Try without region/script subtags: "en-US" → "en"
    const base = raw.split("-")[0];
    if (SUPPORTED_SET.has(base)) return base;
  }
  return "en";
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Playground() {
  const [locale, setLocale] = useState(detectLocale);
  const [ruleSetNames, setRuleSetNames] = useState<string[]>([]);
  const [ruleSet, setRuleSet] = useState("");
  const [input, setInput] = useState("42");
  const [mode, setMode] = useState<"format" | "parse">("format");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fmtRef = useRef<RuleBasedNumberFormat | null>(null);

  // Recreate formatter when locale changes
  useEffect(() => {
    try {
      const fmt = RuleBasedNumberFormat.fromLocale(locale);
      fmtRef.current = fmt;
      const names = fmt.getRuleSetNames();
      setRuleSetNames(names);
      setRuleSet(fmt.getDefaultRuleSetName());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [locale]);

  // Recompute output when input, ruleSet, mode or locale changes
  useEffect(() => {
    const fmt = fmtRef.current;
    if (!fmt) return;
    try {
      if (mode === "format") {
        const num = Number(input);
        if (input.trim() === "" || isNaN(num)) {
          setOutput("");
          setError("Enter a valid number");
          return;
        }
        setOutput(fmt.format(num, ruleSet || undefined));
        setError(null);
      } else {
        if (input.trim() === "") {
          setOutput("");
          setError(null);
          return;
        }
        const result = fmt.parse(input);
        setOutput(String(result));
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput("");
    }
  }, [input, ruleSet, mode, locale]);

  return (
    <div className={styles.playground}>
      {/* ── Controls row ── */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label} htmlFor="pg-locale">
            Locale
          </label>
          <select
            id="pg-locale"
            className={styles.select}
            value={locale}
            onChange={e => setLocale(e.target.value)}
          >
            {ALL_LOCALES.map(tag => (
              <option key={tag} value={tag}>
                {localeLabel(tag)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label} htmlFor="pg-ruleset">
            Rule set
          </label>
          <select
            id="pg-ruleset"
            className={styles.select}
            value={ruleSet}
            onChange={e => setRuleSet(e.target.value)}
          >
            {ruleSetNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Mode</label>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === "format" ? styles.modeBtnActive : ""}`}
              onClick={() => {
                if (mode === "parse") {
                  const fmt = fmtRef.current;
                  if (fmt && output && !error) {
                    // Round-trip: use the parsed number as the new format input
                    setInput(output);
                  } else {
                    setInput("42");
                  }
                  setMode("format");
                }
              }}
            >
              format
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "parse" ? styles.modeBtnActive : ""}`}
              onClick={() => {
                if (mode === "format") {
                  const fmt = fmtRef.current;
                  if (fmt && output && !error) {
                    // Round-trip: use the formatted words as the new parse input
                    setInput(output);
                  } else {
                    setInput(fmt ? fmt.format(42, ruleSet || undefined) : "forty-two");
                  }
                  setMode("parse");
                }
              }}
            >
              parse
            </button>
          </div>
        </div>
      </div>

      {/* ── I/O row ── */}
      <div className={styles.ioRow}>
        <div className={styles.ioBox}>
          <div className={styles.ioLabel}>{mode === "format" ? "Number" : "Words"}</div>
          <input
            className={styles.inputField}
            type={mode === "format" ? "number" : "text"}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === "format" ? "Enter a number…" : "Enter spelled-out text…"}
            spellCheck={false}
          />
        </div>

        <div className={styles.arrow} aria-hidden>
          →
        </div>

        <div className={styles.ioBox}>
          <div className={styles.ioLabel}>{mode === "format" ? "Words" : "Number"}</div>
          <div className={`${styles.outputField} ${error ? styles.outputError : ""}`}>
            {error ? <span className={styles.errorText}>{error}</span> : output || "\u00a0"}
          </div>
        </div>
      </div>
    </div>
  );
}
