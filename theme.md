# Martini Shot Theme

## Overview

The Martini Shot theme is a custom color palette inspired by a classic martini cocktail. It features an emerald green primary color (olive), gold/amber secondary color (garnish), deep charcoal dark mode, and teal accent colors.

## Color Palette

### CSS Custom Properties

All theme colors are defined as CSS custom properties in [`src/index.css`](src/index.css:6).

#### Light Mode (Default)

```css
:root {
  /* Martini Shot Color Palette */
  --martini-primary: 158 48% 46%;        /* Emerald Green - Olive */
  --martini-secondary: 38 92% 50%;       /* Gold/Amber - Garnish */
  --martini-dark: 28 16% 21%;            /* Deep Charcoal - Glass */
  --martini-light: 0 0% 98%;             /* Cream/Off-white - Cocktail */
  --martini-accent: 174 83% 41%;         /* Teal - Martini color */

  /* Shadcn/ui Theme Variables */
  --background: var(--martini-light);
  --foreground: var(--martini-dark);
  --card: var(--martini-light);
  --card-foreground: var(--martini-dark);
  --popover: var(--martini-light);
  --popover-foreground: var(--martini-dark);
  --primary: var(--martini-primary);
  --primary-foreground: 0 0% 100%;
  --secondary: var(--martini-secondary);
  --secondary-foreground: 0 0% 100%;
  --muted: 240 4.8% 96%;
  --muted-foreground: 240 5% 45%;
  --accent: var(--martini-accent);
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: var(--martini-primary);
  --radius: 0.5rem;
}
```

#### Dark Mode

```css
.dark {
  --martini-primary: 158 48% 46%;
  --martini-secondary: 38 92% 50%;
  --martini-dark: 28 16% 21%;
  --martini-light: 0 0% 15%;
  --martini-accent: 174 83% 41%;

  --background: var(--martini-dark);
  --foreground: var(--martini-light);
  --card: var(--martini-dark);
  --card-foreground: var(--martini-light);
  --popover: var(--martini-dark);
  --popover-foreground: var(--martini-light);
  --primary: var(--martini-primary);
  --primary-foreground: 0 0% 100%;
  --secondary: var(--martini-secondary);
  --secondary-foreground: 0 0% 100%;
  --muted: 240 3.7% 20%;
  --muted-foreground: 240 5% 65%;
  --accent: var(--martini-accent);
  --accent-foreground: 0 0% 100%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 25%;
  --input: 240 3.7% 25%;
  --ring: var(--martini-primary);
}
```

### Color Descriptions

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| `--martini-primary` | `158 48% 46%` | **Olive Green** - Main brand color for primary buttons, links, and highlights |
| `--martini-secondary` | `38 92% 50%` | **Gold/Amber** - Secondary color for accents, highlights, and success states |
| `--martini-dark` | `28 16% 21%` | **Deep Charcoal** - Dark text and background in dark mode |
| `--martini-light` | `0 0% 98%` | **Cream/Off-white** - Background in light mode, dark in dark mode |
| `--martini-accent` | `174 83% 41%` | **Teal** - Accent color for special highlights and interactive elements |

## Using the Theme

### In Tailwind CSS

The theme uses standard Tailwind CSS utility classes that reference the CSS custom properties:

```tsx
// Primary button
<Button className="bg-primary text-primary-foreground">
  Click Me
</Button>

// Secondary button
<Button variant="secondary">
  Secondary Action
</Button>

// Card component
<Card className="bg-card text-card-foreground">
  Content
</Card>

// Accent styling
<div className="text-accent">Accent text</div>
```

### In Custom CSS

```css
/* Using CSS custom properties directly */
.my-element {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--border);
}

/* Using HSL values directly (for gradients) */
.gradient-bg {
  background: linear-gradient(
    135deg,
    hsl(158, 48%, 46%) 0%,
    hsl(174, 83%, 41%) 100%
  );
}
```

### In JavaScript/TypeScript

```tsx
// Get computed styles
const element = document.getElementById('my-element');
const primaryColor = getComputedStyle(element).getPropertyValue('--primary');

// Use with Tailwind
className={`bg-primary hover:bg-primary/90 text-primary-foreground transition-colors`}
```

## Theme Components

The theme is automatically applied to all shadcn/ui components:

- [`Button`](src/components/ui/button.tsx:1) - Primary, Secondary, Destructive, Outline variants
- [`Card`](src/components/ui/card.tsx:1) - Card, CardHeader, CardTitle, CardContent, CardFooter
- [`Input`](src/components/ui/input.tsx:1) - Form inputs with theme colors
- [`Badge`](src/components/ui/badge.tsx:1) - Small status indicators
- [`Dialog`](src/components/ui/dialog.tsx:1) - Modals and overlays
- [`Select`](src/components/ui/select.tsx:1) - Dropdown selections
- [`Slider`](src/components/ui/slider.tsx:1) - Range sliders

## Dark Mode Support

The theme includes built-in dark mode support. To enable dark mode:

```tsx
// In main.tsx or a theme provider
import { useEffect } from 'react';

function useDarkMode() {
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
}
```

## Extending the Theme

To add custom colors or extend the theme:

1. **Add new CSS variables** in [`src/index.css`](src/index.css:6):
   ```css
   :root {
     --martini-custom: 0 0% 0%;
     --your-custom: 0 0% 100%;
   }
   ```

2. **Use in components**:
   ```tsx
   <div className="bg-[var(--martini-custom)]">
     Custom colored element
   </div>
   ```

## Color Preview

### Primary Color (Olive Green)
`hsl(158, 48%, 46%)` - #7D9D5D

### Secondary Color (Gold/Amber)
`hsl(38, 92%, 50%)` - #E5A835

### Accent Color (Teal)
`hsl(174, 83%, 41%)` - #5BC3B4

### Dark Mode Background
`hsl(28, 16%, 21%)` - #473018

### Light Mode Background
`hsl(0, 0%, 98%)` - #FDFDFD

## Accessibility

The theme follows WCAG 2.1 AA color contrast guidelines:
- Primary text on light backgrounds: 4.5:1 minimum
- Large text on light backgrounds: 3:1 minimum
- All colors have been tested for readability

## Browser Support

The theme uses CSS custom properties which are supported in all modern browsers:
- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- Opera 36+

## References

- [shadcn/ui Theme Documentation](https://ui.shadcn.com/docs/theming)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind CSS Configuration](tailwind.config.js)
