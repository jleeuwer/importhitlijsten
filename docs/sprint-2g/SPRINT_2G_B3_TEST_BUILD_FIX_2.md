# Sprint 2G-B3 Test/Build Fix 2 — Playwright webServer

## Aanleiding

Na test/build fix 1 startte `npm run test:e2e` wel correct als Playwright-suite, maar de e2e-test faalde wanneer de Importhitlijst-server niet al handmatig draaide op poort 3003:

```text
apiRequestContext.get: connect ECONNREFUSED ::1:3003
GET http://localhost:3003/api/health
```

## Oplossing

Playwright start de Importhitlijst-server nu zelf via `webServer` in `playwright.config.js`.

Belangrijkste keuzes:

- standaard `baseURL`: `http://127.0.0.1:3003`
- geen `localhost`, zodat macOS/Node niet onverwacht naar IPv6 `::1` resolveert
- `reuseExistingServer: true`, zodat een al draaiende lokale server hergebruikt wordt
- `webServer.url` wacht op `/api/health`
- server start met `NODE_ENV=test PORT=3003 tsx server.js`

De e2e-test gebruikt nu de Playwright `baseURL`:

```js
await request.get("/api/health")
```

## Logging

`config/logger.js` maakt de `logs/` directory nu zelf aan voordat Winston file transports worden geregistreerd. Dit voorkomt startproblemen wanneer een test of script de server start in een schone checkout zonder bestaande logdirectory.

## Testcommando

```bash
mkdir -p logs
npm run test:e2e 2>&1 | tee "logs/test-e2e-$(date +%Y%m%d-%H%M%S).log"
```

Optioneel met alternatieve poort:

```bash
mkdir -p logs
E2E_PORT=3004 npm run test:e2e 2>&1 | tee "logs/test-e2e-$(date +%Y%m%d-%H%M%S).log"
```
