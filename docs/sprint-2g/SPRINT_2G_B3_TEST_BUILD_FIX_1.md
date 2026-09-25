# Sprint 2G-B3 Test/Build Fix 1

## Aanleiding

Na validatie van Sprint 2G-B3 zijn drie bevindingen gemeld:

1. Er ontbreekt een standaard `npm run install:all` script zoals in de andere apps.
2. `npm run build` geeft een CSS-minify warning: `Unexpected "/" [css-syntax-error]`.
3. `npm run test:e2e` / `playwright test` pakt ongewenst Vitest-testbestanden mee en faalt met `TypeError: Cannot redefine property: Symbol($$jest-matchers-object)`.

## Oplossingen

### 1. Install-all script

Toegevoegd:

- `scripts/install-all.sh`
- package script: `npm run install:all`

Gebruik:

```bash
mkdir -p logs
npm run install:all 2>&1 | tee "logs/npm-install-all-$(date +%Y%m%d-%H%M%S).log"
```

Voor deze app installeert het script de root dependencies. Omdat backend en frontend in dezelfde package zitten, zijn er geen extra subprojecten nodig.

### 2. CSS build warning

In `src/ui/styles/navbar.css` stond een losse afsluitende comment marker:

```css
} */
```

Deze is gecorrigeerd naar:

```css
}
```

Daarmee verdwijnt de esbuild CSS syntax warning tijdens `npm run build`.

### 3. Playwright/Vitest conflict

Toegevoegd:

- `playwright.config.js`

Aangepast:

- `test:e2e` gebruikt nu expliciet `playwright test --config=playwright.config.js`.

De Playwright-config beperkt test discovery tot:

```text
tests/e2e/**/*.spec.js
```

Hierdoor worden Vitest unit/react-testbestanden niet meer door Playwright opgepakt. Daarmee wordt het conflict rond jest-dom/Vitest matchers voorkomen.

## Testcommando's

```bash
mkdir -p logs
npm run install:all 2>&1 | tee "logs/npm-install-all-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
npm run build 2>&1 | tee "logs/npm-build-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
npm run test:e2e 2>&1 | tee "logs/test-e2e-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
npm run test:sprint2g-b3 2>&1 | tee "logs/test-sprint2g-b3-fix1-$(date +%Y%m%d-%H%M%S).log"
```
