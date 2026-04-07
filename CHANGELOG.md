# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [48.2.0] - 2026-04-07

### Added

- TypeScript implementation of ICU Rule-Based Number Formatting (RBNF)
- `RuleBasedNumberFormat` class with `fromLocale()`, `fromCldrData()`, `format()`, and `parse()` methods
- Support for 89 CLDR locales via the `cldr-rbnf` package
- Custom RBNF rule string constructor for user-defined rule sets
- Dual ESM/CJS package output with TypeScript declarations
- Documentation website with Docusaurus (Getting Started, API Reference, Supported Locales, `und` Locale, Examples, Tutorial)
- Live playground for interactive number-to-words conversion across all locales
- GitHub Actions workflow for deploying docs to GitHub Pages
- GitHub Actions workflow for publishing to npm with provenance and automatic GitHub Releases
- Google Analytics support via environment variable (`GTAG_ID`)
