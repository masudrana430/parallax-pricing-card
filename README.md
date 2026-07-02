# Parallax Pricing

A premium, responsive, and interactive pricing component built for the Parallax Labs Frontend Developer Intern technical screening.

The project includes monthly and annual billing options, animated price transitions, light and dark themes, reusable components, responsive layouts, and accessible interactions.

![Parallax Pricing dark theme](./public/preview-dark.png)

## Live Demo

- Live Website: Add your Vercel URL here
- GitHub Repository: Add your GitHub repository URL here

## Features

- Monthly and annual billing toggle
- Smooth animated price transitions
- 20% annual billing discount
- Light, dark, and system theme support
- Animated theme switcher
- Responsive pricing cards
- Premium glassmorphism interface
- Cursor-following card spotlight
- Subtle 3D card tilt animation
- Staggered entrance animations
- Interactive plan-selection feedback
- Keyboard-accessible controls
- Reduced-motion support
- Mobile, tablet, and desktop layouts

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Motion for React
- next-themes
- Lucide React
- clsx
- tailwind-merge

## Screenshots

### Dark Theme

![Dark theme](./public/preview-dark.png)

### Light Theme

![Light theme](./public/preview-light.png)

## Project Structure

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   └── Footer.tsx
│   ├── pricing/
│   │   ├── BillingToggle.tsx
│   │   ├── PlanSelectionToast.tsx
│   │   ├── PricingCard.tsx
│   │   └── PricingSection.tsx
│   ├── providers/
│   │   └── ThemeProvider.tsx
│   └── ui/
│       └── ThemeToggle.tsx
├── data/
│   └── pricing.ts
├── lib/
│   └── utils.ts
└── types/
    └── pricing.ts
```

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Enter the project:

```bash
cd parallax-pricing-card
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

## Available Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Design Decisions

The interface combines a clean SaaS pricing structure with a premium cosmic visual style. Violet, cyan, and pink accents create a distinctive identity while maintaining readable typography and clear visual hierarchy.

Animations are intentionally subtle and support the interaction rather than distracting from the pricing information.

## Accessibility

The project includes:

- Semantic buttons and sections
- ARIA labels for interactive controls
- Keyboard-visible focus states
- Live regions for price and plan updates
- Reduced-motion support
- Appropriate color contrast
- Disabled pointer-intensive effects on touch devices

## Author

**Masud Rana**

Frontend and MERN-stack developer based in Chittagong, Bangladesh.

## License

This project was created as a technical screening submission.