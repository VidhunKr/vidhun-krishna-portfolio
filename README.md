# Vidhun Krishna — Frontend Developer Portfolio

Personal portfolio of **Vidhun Krishna M**, a Frontend Developer based in Kerala, India.  
Built to showcase clean UI, thoughtful motion, and production-ready frontend craft.

[![Live Site](https://img.shields.io/badge/Live-vidhun-krishna-portfolio.vercel.app-5b8cff?style=flat-square)](https://vidhun-krishna-portfolio.vercel.app)
[![Tech](https://img.shields.io/badge/Stack-HTML%20·%20SCSS%20·%20JS-0e0f14?style=flat-square)](#tech-stack)
[![Focus](https://img.shields.io/badge/Focus-Angular%20·%20TypeScript-111827?style=flat-square)](#)

---

## Live

| Resource | Link |
| --- | --- |
| Website | [vidhun-krishna-portfolio.vercel.app](https://vidhun-krishna-portfolio.vercel.app) |
| Email | [vidhunkrishna007@gmail.com](mailto:vidhunkrishna007@gmail.com) |
| LinkedIn | [vidhun-krishna-m](https://www.linkedin.com/in/vidhun-krishna-m) |
| GitHub | [VidhunKr](https://github.com/VidhunKr) |

---

## About this project

A single-page portfolio experience featuring:

- Animated preloader with logo handoff into the navbar
- Responsive glass navigation (desktop + mobile)
- About, skills, projects, experience, and contact sections
- Skills carousel with in-view autoplay
- Contact form powered by Google Apps Script
- SEO-ready meta tags, Open Graph preview, JSON-LD, sitemap

Designed for clarity first — motion supports hierarchy, never distracts from content.

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Structure | HTML5 |
| Styling | SCSS (compiled to CSS) |
| Behavior | Vanilla JavaScript |
| Motion | GSAP + ScrollTrigger |
| Scroll | Lenis |
| Build | Sass via npm |

---

## Project structure

```text
├── index.html              # Main portfolio page
├── css/                    # Compiled styles
├── scss/                   # Source styles
├── js/
│   ├── config.js           # Site URL, socials, form endpoint
│   ├── main.js             # Skills, projects, experience wiring
│   ├── preloader.js        # Loading sequence + logo handoff
│   ├── navigation.js       # Navbar + mobile menu
│   ├── animations.js       # Scroll reveals + Lenis
│   ├── contact.js          # Form handling
│   └── data/               # Projects, skills, experience content
├── assets/
│   ├── images/             # Portraits, projects, OG preview
│   ├── favicon/
│   └── icons/
├── robots.txt
├── sitemap.xml
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Watch SCSS while developing

```bash
npm run watch:css
```

Serve the root folder with Live Server (or any static file server) and open `index.html`.

### Build CSS for production

```bash
npm run build:css
```

---

## Configuration

Update `js/config.js` before deploying:

```js
SITE_URL: "https://your-domain.com",
SOCIAL: {
  github: "https://github.com/VidhunKr",
  linkedin: "https://www.linkedin.com/in/vidhun-krishna-m",
  email: "mailto:vidhunkrishna007@gmail.com",
},
GOOGLE_SCRIPT_URL: "https://script.google.com/.../exec"
```

Also sync these with your live domain:

- Canonical + Open Graph URLs in `index.html`
- `robots.txt`
- `sitemap.xml`

---

## Highlights

- **Performance-minded** static frontend
- **Accessible motion** with reduced-motion support
- **Mobile-first** layout and navigation
- **SEO foundations** for search and social sharing
- **Data-driven sections** for easy content updates

---

## License

© Vidhun Krishna. All rights reserved.

This repository contains personal portfolio design and content.  
Please do not copy or redistribute without permission.
