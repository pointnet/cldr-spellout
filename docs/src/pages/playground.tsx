import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

function PlaygroundContent() {
  // Lazy-require inside BrowserOnly so the heavy locale data only loads on the client
  const Playground = require("../components/Playground").default;
  return <Playground />;
}

export default function PlaygroundPage() {
  return (
    <Layout
      title="Playground"
      description="Try cldr-spellout live — convert numbers to words in 89 locales"
    >
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Live Playground</h1>
        <p>
          Select a locale and rule set, enter a number, and see it converted to words in real time.
          Switch to <strong>parse</strong> mode to go the other way — words back to a number.
        </p>
        <BrowserOnly fallback={<div>Loading playground…</div>}>
          {() => <PlaygroundContent />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
