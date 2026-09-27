#!/usr/bin/env bash

# Start geselecteerde npm-taken en schrijf per taak een apart logbestand.
# Compatibel met de standaard Bash 3.2 op macOS.
# Importhitlijst variant, gebaseerd op de Artist startapp-opzet.

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
KEEP_DAYS=0
CONTINUE_ON_ERROR=0
ACTION_COUNT=0

usage() {
  cat <<'USAGE'
Gebruik:
  ./startapp.sh [opties] <commando> [commando ...]
  ./startapp.sh [opties] --commands install,build,validate,test,dev

Commando's:
  install   Voer: npm run install:all
  build     Voer: npm run build:all
  validate  Voer: npm run validate
  test      Voer: npm run test:all
  dev       Voer: npm run dev:5174 (wordt altijd als laatste gestart)
  all       Voer volledige validate (install + build + test:all) uit en start daarna dev

Opties:
  -k, --keep-days N       Verwijder .log-bestanden ouder dan N dagen.
                         N=0 betekent niets verwijderen (standaard).
  -c, --commands LIJST   Kommagescheiden lijst, bijvoorbeeld build,validate,test.
      --continue-on-error Ga na een mislukte taak verder met de volgende.
  -h, --help              Toon deze hulptekst.

Voorbeelden:
  ./startapp.sh build
  ./startapp.sh validate test
  ./startapp.sh --keep-days 14 install build validate test
  ./startapp.sh -k 30 --commands build,validate,test
  ./startapp.sh all
USAGE
}

error() {
  printf 'FOUT: %s\n' "$*" >&2
}

is_non_negative_integer() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

contains_action() {
  local wanted="$1"
  shift
  local item
  for item in "$@"; do
    [ "$item" = "$wanted" ] && return 0
  done
  return 1
}

add_action() {
  local action="$1"

  case "$action" in
    install|build|validate|test|dev)
      # Bash 3.2 + `set -u` beschouwt een lege array-expansie soms als
      # een ongebonden variabele. Roep contains_action daarom pas aan
      # zodra de array daadwerkelijk een element bevat.
      if [ "$ACTION_COUNT" -eq 0 ] || ! contains_action "$action" "${ACTIONS[@]}"; then
        ACTIONS+=("$action")
        ACTION_COUNT=$((ACTION_COUNT + 1))
      fi
      ;;
    all)
      # validate voert install + build + de volledige test-suite uit.
      # Zo voorkomt 'all' dubbele install/build/test-runs.
      add_action validate
      add_action dev
      ;;
    *)
      error "Onbekend commando: $action"
      usage >&2
      exit 2
      ;;
  esac
}

parse_command_list() {
  local list="$1"
  local old_ifs="$IFS"
  local item

  IFS=','
  for item in $list; do
    IFS="$old_ifs"
    item="$(printf '%s' "$item" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -n "$item" ] || continue
    add_action "$item"
    IFS=','
  done
  IFS="$old_ifs"
}

cleanup_logs() {
  mkdir -p "$LOG_DIR"

  if [ "$KEEP_DAYS" -eq 0 ]; then
    printf 'Logopschoning overgeslagen (--keep-days 0).\n'
    return 0
  fi

  printf 'Verwijder logbestanden ouder dan %s dagen uit %s\n' "$KEEP_DAYS" "$LOG_DIR"

  # Beperk de verwijdering bewust tot gewone .log-bestanden in de logmap.
  find "$LOG_DIR" -type f -name '*.log' -mtime "+$KEEP_DAYS" -print -delete
}

run_npm_task() {
  local action="$1"
  local npm_script="$2"
  local log_prefix="$3"
  local timestamp
  local logfile
  local status

  timestamp="$(date '+%Y%m%d-%H%M%S')"
  logfile="$LOG_DIR/${log_prefix}-${timestamp}.log"

  printf '\n============================================================\n'
  printf 'Start: %s\n' "$action"
  printf 'Commando: npm run %s\n' "$npm_script"
  printf 'Logbestand: %s\n' "$logfile"
  printf '============================================================\n'

  npm run "$npm_script" 2>&1 | tee "$logfile"
  status=${PIPESTATUS[0]}

  if [ "$status" -ne 0 ]; then
    error "Taak '$action' is mislukt met exitcode $status. Zie: $logfile"
    return "$status"
  fi

  printf "Taak '%s' is succesvol afgerond.\n" "$action"
  return 0
}

ACTIONS=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    -k|--keep-days)
      [ "$#" -ge 2 ] || { error "Waarde ontbreekt na $1"; exit 2; }
      KEEP_DAYS="$2"
      shift 2
      ;;
    --keep-days=*)
      KEEP_DAYS=${1#*=}
      shift
      ;;
    -c|--commands)
      [ "$#" -ge 2 ] || { error "Waarde ontbreekt na $1"; exit 2; }
      parse_command_list "$2"
      shift 2
      ;;
    --commands=*)
      parse_command_list "${1#*=}"
      shift
      ;;
    --continue-on-error)
      CONTINUE_ON_ERROR=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while [ "$#" -gt 0 ]; do
        add_action "$1"
        shift
      done
      ;;
    -* )
      error "Onbekende optie: $1"
      usage >&2
      exit 2
      ;;
    *)
      add_action "$1"
      shift
      ;;
  esac
done

if ! is_non_negative_integer "$KEEP_DAYS"; then
  error "--keep-days moet een geheel getal van 0 of hoger zijn."
  exit 2
fi

if [ "$ACTION_COUNT" -eq 0 ]; then
  error "Geef minimaal één commando op: install, build, validate, test, dev of all."
  usage >&2
  exit 2
fi

command -v npm >/dev/null 2>&1 || { error "npm is niet gevonden in PATH."; exit 127; }
[ -f "$SCRIPT_DIR/package.json" ] || { error "Geen package.json gevonden in $SCRIPT_DIR"; exit 1; }

cd "$SCRIPT_DIR" || { error "Kan niet naar scriptdirectory: $SCRIPT_DIR"; exit 1; }
cleanup_logs

# Vaste functionele volgorde. 'dev' staat bewust als laatste omdat dit normaal
# een langlopend proces is.
ORDERED_ACTIONS="install build validate test dev"
OVERALL_STATUS=0

for action in $ORDERED_ACTIONS; do
  # ACTION_COUNT is hier altijd groter dan nul; hierdoor is de array-expansie
  # ook veilig onder de standaard Bash 3.2 van macOS met `set -u`.
  contains_action "$action" "${ACTIONS[@]}" || continue

  case "$action" in
    install)  npm_script='install:all'; log_prefix='npm-install-all' ;;
    build)    npm_script='build:all';   log_prefix='npm-build-all' ;;
    validate) npm_script='validate';    log_prefix='validate' ;;
    test)     npm_script='test:all';    log_prefix='test-all' ;;
    dev)      npm_script='dev:5174';    log_prefix='dev-5174' ;;
  esac

  if run_npm_task "$action" "$npm_script" "$log_prefix"; then
    :
  else
    status=$?
    OVERALL_STATUS=$status
    if [ "$CONTINUE_ON_ERROR" -eq 0 ]; then
      exit "$status"
    fi
  fi
done

exit "$OVERALL_STATUS"
