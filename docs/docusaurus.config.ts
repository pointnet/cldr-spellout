import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "cldr-spellout",
  tagline: "Convert numbers to words across 89 locales",
  favicon: "img/favicon.svg",

  url: "https://pointnet.github.io",
  baseUrl: "/cldr-spellout/",

  organizationName: "pointnet",
  projectName: "cldr-spellout",
  trailingSlash: false,

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
        gtag: process.env.GTAG_ID ? { trackingID: process.env.GTAG_ID } : undefined,
      } satisfies Preset.Options,
    ],
  ],

  // Alias the library to its CJS build so webpack doesn't choke on
  // the `with { type: "json" }` import attributes in the ESM output.
  plugins: [
    function resolveCldrSpelloutCjs() {
      return {
        name: "resolve-cldr-spellout-cjs",
        configureWebpack() {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require("path") as typeof import("path");
          // Locate the package root via its package.json export (always in the map),
          // then navigate to the CJS entry. This avoids relying on unexported subpaths.
          const pkgDir = path.dirname(
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require.resolve("@pointnet/cldr-spellout/package.json"),
          );
          return {
            resolve: {
              alias: {
                "@pointnet/cldr-spellout": path.join(pkgDir, "dist/cjs/index.js"),
              },
            },
          };
        },
      };
    },
  ],

  themeConfig: {
    image: "img/social-card.png",
    navbar: {
      title: "cldr-spellout",
      logo: {
        alt: "cldr-spellout logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        { to: "/playground", label: "Playground", position: "left" },
        {
          href: "https://github.com/pointnet/cldr-spellout",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://www.npmjs.com/package/@pointnet/cldr-spellout",
          label: "npm",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting Started", to: "/docs/getting-started" },
            { label: "API Reference", to: "/docs/api-reference" },
            { label: "Supported Locales", to: "/docs/supported-locales" },
            { label: "Examples", to: "/docs/examples" },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/pointnet/cldr-spellout",
            },
            {
              label: "npm",
              href: "https://www.npmjs.com/package/@pointnet/cldr-spellout",
            },
          ],
        },
      ],
      copyright: `MIT © pointnet. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["typescript", "bash"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
