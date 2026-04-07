import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "../components/HomepageFeatures";
import styles from "./index.module.css";

const HERO_EXAMPLES = [
  { number: 42, locale: "en", output: "forty-two" },
  { number: 42, locale: "de", output: "zweiundvierzig" },
  { number: 42, locale: "fr", output: "quarante-deux" },
  { number: 42, locale: "ru", output: "сорок два" },
  { number: 42, locale: "ja", output: "四十二" },
  { number: 42, locale: "ar", output: "اثنان وأربعون" },
];

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroTagline}>{siteConfig.tagline}</p>

        <div className={styles.examplesGrid}>
          {HERO_EXAMPLES.map(ex => (
            <div key={ex.locale} className={styles.exampleItem}>
              <span className={styles.exampleLocale}>{ex.locale}</span>
              <span className={styles.exampleNumber}>{ex.number}</span>
              <span className={styles.exampleArrow}>→</span>
              <span className={styles.exampleOutput}>{ex.output}</span>
            </div>
          ))}
        </div>

        <div className={styles.codeSnippet}>
          <code>
            {"import { RuleBasedNumberFormat } from '@pointnet/cldr-spellout';\n"}
            {"const fmt = RuleBasedNumberFormat.fromLocale('fr');\n"}
            {"fmt.format(42); // → 'quarante-deux'"}
          </code>
        </div>

        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="/playground">
            Try the Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout description="Convert numbers to words across 89 CLDR locales. TypeScript implementation of ICU Rule-Based Number Formatting.">
      <HeroSection />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
