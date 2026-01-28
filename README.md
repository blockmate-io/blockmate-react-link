# Blockmate Link Monorepo

Monorepo for Blockmate Link packages:
- `@blockmate.io/blockmate-js-link` (vanilla JS)
- `@blockmate.io/blockmate-react-link` (React wrapper)

## Packages

- `js-link/` — vanilla JS core package
- `react-wrapper/` — React wrapper package

## Development

Install deps at repo root:
```bash
npm install
```

Build all packages:
```bash
npm run build
```

Build a single package:
```bash
npm --workspace js-link run build
npm --workspace react-wrapper run build
```

## Publishing

Publish from each package folder:
```bash
cd js-link && npm publish
cd ../react-wrapper && npm publish
```

## License

MIT © blockmate-io
