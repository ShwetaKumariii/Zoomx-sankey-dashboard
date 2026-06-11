# Gyn DE ATU 2026 – Treatment Sequencing Dashboard

🔗 **Live dashboard:** https://shweta-kumari-zoomrx.github.io/Zoomx-sankey-dashboard/

An interactive Sankey-flow dashboard built on the Gyn DE ATU 2026 dataset (Endometrial, Ovarian, Cervical), designed to speed up slide updates and storyboarding by letting you explore the treatment-sequencing data live instead of rebuilding charts in PowerPoint each time.

## Key views

- **Sankey flow by indication** — visualize 1L → 2L → 3L treatment sequences for EC/OC/CC, with drag-to-reorder nodes, n/% hover toggle, and brand-matched regimen colors (consistent with the deck palette)
- **Filter by Practice Setting & Specialty** (and other segments) — slice the flow to storyboard specific physician subgroups before committing a chart to the deck
- **Copy Chart** — export the current Sankey view as an image for direct paste into slides
- **Summary Data export** — download an Excel workbook (regimen distribution, 1L→2L / 2L→3L transition tables, sequence pivot) for any active filter combination
- **User-level table** — per-respondent detail (completion time, LOT1/2/3, specialty, practice setting, segments) with search/filter — useful for spotting **rechallengers** (e.g. respondents who return to a prior-line regimen at a later line) and reviewing their profile

## Data refresh workflow

1. Update `data/Sankey_RD_master.xlsx` (private master file, kept out of git) with new data
2. Run `npm run deploy` — this automatically:
   - Strips PII (First/Last Name) into `public/Sankey_RD.xlsx`
   - Builds the production bundle
   - Publishes to GitHub Pages (`gh-pages` branch)

---

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run deploy`
Sanitizes data, builds, and publishes to GitHub Pages.
