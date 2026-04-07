import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  description: string;
  examples: { locale: string; number: string; output: string }[];
};

const FEATURES: FeatureItem[] = [
  {
    title: "89 CLDR Locales",
    description:
      "Built on Unicode CLDR data. Covers major world languages including right-to-left scripts, " +
      "tonal languages, and complex grammatical systems like Polish or Arabic.",
    examples: [
      { locale: "en", number: "42", output: "forty-two" },
      { locale: "ar", number: "42", output: "اثنان وأربعون" },
      { locale: "zh", number: "42", output: "四十二" },
    ],
  },
  {
    title: "Format & Parse",
    description:
      "Convert numbers to spelled-out words, or parse words back to numbers. " +
      "Supports ordinals, decimals, negatives, and locale-specific rule sets.",
    examples: [
      { locale: "en", number: "format(1001)", output: '"one thousand one"' },
      { locale: "en", number: "format(1, '%digits-ordinal')", output: '"1st"' },
      { locale: "en", number: 'parse("twenty")', output: "20" },
    ],
  },
  {
    title: "Zero Runtime Dependencies",
    description:
      "Only one dependency: the CLDR data package itself. " +
      "Ships as dual ESM/CJS, fully tree-shakeable, with TypeScript types included.",
    examples: [
      { locale: "install", number: "", output: "npm i @pointnet/cldr-spellout" },
      { locale: "import", number: "", output: "RuleBasedNumberFormat" },
      { locale: "license", number: "", output: "MIT" },
    ],
  },
];

function Feature({ title, description, examples }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.featureCard}>
        <h3>{title}</h3>
        <p>{description}</p>
        <ul className={styles.exampleList}>
          {examples.map(ex => (
            <li key={ex.locale + ex.number}>
              <span className={styles.exampleInput}>{ex.number || ex.locale}</span>
              {ex.number ? <span className={styles.arrow}>→</span> : null}
              <span className={styles.exampleOutput}>{ex.output}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FEATURES.map((item, idx) => (
            <Feature key={idx} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
