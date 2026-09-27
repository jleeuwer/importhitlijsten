# 2H-W installatie en acceptatie

## Copy-over

```bash
unzip importhitlijst_sprint2h_w_build_startapp_hardening_code_20260830.zip
rsync -av importhitlijst_sprint2h_w_build_startapp_hardening_code_20260830/ /pad/naar/importhitlijst/
cd /pad/naar/importhitlijst
chmod +x startapp.sh
```

## Package scripts toevoegen

```bash
node scripts/apply_2h_w_package_scripts.js
```

Toegevoegde scripts:

```json
{
  "preflight:2h-w": "node scripts/preflight_2h_w.js",
  "test:sprint2h-w": "vitest run --config vite.config.js tests/static_2h_w_build_startapp_hardening.test.js"
}
```

Het script weigert bestaande scripts met dezelfde naam te overschrijven.

## Acceptatietests

```bash
./startapp.sh
./startapp.sh --help
./startapp.sh build
./startapp.sh --commands build,validate,test
npm run preflight:2h-w
npm run test:sprint2h-w
```

Verwacht gedrag:

- Zonder argumenten: usage en exitcode 2; geen npm-taak wordt gestart.
- `build`: alleen `npm run build:all`.
- `--commands build,validate,test`: build, validate en e2e-test in vaste volgorde.
- `all`: install, build, validate, test en dev; dev als laatste.

## Database

Geen database-migratie nodig.
