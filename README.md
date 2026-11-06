# EVA-0 project page

Project website for **EVA-0: Test-Time Model Evolution with Only Two Forward Passes per Sample**.

- Website: https://cascol-chen.github.io/EVA-0-project-page/
- Paper: https://arxiv.org/abs/2605.18867

This repository hosts the project website. `index.html` contains the paper content and embedded paper figures; `assets/` contains the animated illustrations, styles, and pinned browser libraries. Google Fonts supplies the web fonts. No build step or backend is needed.

The cover uses Three.js for a procedural weight-space relief, with a complete SVG fallback. GSAP drives the shared story clock. The three discoveries and method diagram use SVG/HTML, with pause/replay controls, visibility-aware playback, and reduced-motion states. Weight-space surfaces and trajectories are explicitly schematic; measured results remain separate.

GitHub Pages publishes the root of the `main` branch. To update the website, edit `index.html` and the corresponding assets, commit, and push to `main`. Keep the relative asset paths intact. Preview through a static HTTP server because the cover loads an ES module.

Third-party library versions and licenses are recorded in `assets/vendor/versions.json` and `assets/vendor/THIRD-PARTY-NOTICES.txt`.
