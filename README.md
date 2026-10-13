# Guwahati Water Atlas

A static, GitHub Pages-ready project page presenting JRC Global Surface Water results for Guwahati from 2000–2021.

## Contents

- Annual water-class animations for the city and the 10 km surrounding study extent.
- Year-by-year area viewer driven by CSVs, automatically advancing every 2 seconds.
- Five-year snapshot charts (2000, 2005, 2010, 2015, 2020).
- Section 07 observations comparing annual 2000 vs 2021 class areas and seasonal 2001 vs 2021 class areas, using the supplied CSVs.
- Summer, Monsoon and Winter animations plus seasonal area statistics.
- Section 08 discussion of native annual/monthly class codes, custom seasonal reclassification, annual valid-data mask, and the cross-line artefact.
- Section 09 downloads for CSVs, graphs, and animations.
- Download links to the supplied maps, charts and CSVs.

## Publish on GitHub Pages

1. Download and unzip this archive on your computer.
2. Create a new GitHub repository (for example, `guwahati-water-atlas`).
3. Upload the extracted `index.html`, `styles.css`, `script.js`, `README.md`, and `assets/` folder directly into the repository root (do not upload only the ZIP and do not leave the files nested in an extra folder).
4. Commit to the default branch.
5. In the repository, open **Settings → Pages**.
6. Under build and deployment, choose **Deploy from a branch**, then select the default branch and `/ (root)`.
7. Save and wait for GitHub Pages to publish the site.

The site is static HTML/CSS/JavaScript; no build command or package installation is required. The data ticker fetches CSV files using relative URLs, so test the page through a local web server or the published GitHub Pages URL (opening `index.html` directly with `file://` may block CSV fetches in some browsers).

## Asset note

The supplied archive did not include a standalone boundary-only basemap. The section labeled “10 km surrounding extent preview” uses the first frame from the supplied buffered annual GIF, with its caption explicitly identifying it as a preview.

## Method note

The annual `waterClass` band uses codes 0–3. The monthly `water` band uses codes 0–2. The seasonal output shown in the project is derived from the monthly observations: class 1 means no water in valid monthly observations; class 2 means some but not all valid monthly observations contain water; class 3 means all valid monthly observations contain water; pixels with no valid observations remain masked and display black. The annual valid-data mask retains seasonal output where the corresponding annual `waterClass` is greater than 0.

The cross-line artefact visible in some exported maps was not conclusively diagnosed and is documented as a remaining limitation.


## Recent visual updates

- Replaced the study-area preview with the supplied satellite basemap (`assets/images/guwahati-basemap.png`).
- Changed the hero panel to a static map screenshot; the annual GIFs remain in the animation section.
- Removed the “How it was made” hero button and the “Fixed extent”/preview callouts.
- Added a Guwahati geographic context description and links to local government sources.
- Replaced the vertically stacked `graph.png` with a side-by-side composite of the city and 10 km extent charts; the individual full-resolution charts remain available. The earlier stacked composition is preserved as `assets/images/graph_stacked_original.png`.
- Added an immediate explanation below the three-value/four-display-state GIF comparison and increased explanatory text sizes.
