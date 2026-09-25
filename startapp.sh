#!/usr/bin/env bash

# MusicApp generic startapp
# EXEC-RUNTIME-1 v1.0.0
#
# Doel:
# - selecteerbare npm-acties: install, build, test, dev, all
# - runtime directories veilig initialiseren
# - reproduceerbare dependency-installatie via npm ci
# - Git-worktree na build/test/install niet ongemerkt vervuilen
# - compatibel met Bash 3.2 op macOS
#
# Standaard installatiemodus:
#   ci      = npm ci in iedere npm-root (aanbevolen)
#   legacy  = npm run install:all (alleen voor overgang/legacy apps)
#
# npm-roots:
# - standaard automatisch afgeleid uit tracked package-lock.json-bestanden;
# - expliciet op te geven met --npm-roots .,/client,/server of
#   STARTAPP_NPM_ROOTS=".,client,server".

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${STARTAPP_LOG_DIR:-$SCRIPT_DIR/logs}"
KEEP_DAYS=0
CONTINUE_ON_ERROR=0
ACTION_COUNT=0
INSTALL_MODE="${STARTAPP_INSTALL_MODE:-ci}"
NPM_ROOTS_SPEC="${STARTAPP_NPM_ROOTS:-}"
GIT_GUARD="${STARTAPP_GIT_GUARD:-1}"

ACTIONS=()
NPM_ROOTS=()
NPM_ROOT_COUNT=0
TEMP_FILES=()
GIT_REPO=0
BASELINE_STATUS_FILE=""

usage() {
  cat <<'USAGE'
Gebruik:
  ./startapp.sh [opties] <commando> [commando ...]
  ./startapp.sh [opties] --commands install,build,test,dev

Commando's:
  install   Installeer dependencies reproduceerbaar met npm ci.
            Bij --install-mode legacy: npm run install:all.
  build     Voer: npm run build
  test      Voer: npm run test:all
  dev       Voer: npm run dev (wordt altijd als laatste gestart)
  all       Voer install, build, test en dev uit

Opties:
  -k, --keep-days N         Verwijder .log-bestanden ouder dan N dagen.
                            N=0 betekent niets verwijderen (standaard).
  -c, --commands LIJST     Kommagescheiden lijst, bijvoorbeeld build,test.
      --install-mode MODE   ci (standaard) of legacy.
      --npm-roots LIJST     Kommagescheiden npm-roots, bijvoorbeeld:
                            ".,client,server".
                            Zonder deze optie worden tracked package-lock.json
                            bestanden gebruikt om npm-roots af te leiden.
      --no-git-guard        Sla de Git-mutatiecontrole over.
      --continue-on-error   Ga na een mislukte taak verder met de volgende.
  -h, --help                Toon deze hulptekst.

Environment overrides:
  STARTAPP_LOG_DIR
  STARTAPP_INSTALL_MODE
  STARTAPP_NPM_ROOTS
  STARTAPP_GIT_GUARD

Voorbeelden:
  ./startapp.sh build
  ./startapp.sh --keep-days 14 install build test
  ./startapp.sh --npm-roots ".,client" install
  ./startapp.sh all

Voor legacy apps:
  ./startapp.sh --install-mode legacy install
USAGE
}

error() {
  printf 'FOUT: %s\n' "$*" >&2
}

warn() {
  printf 'WAARSCHUWING: %s\n' "$*" >&2
}

info() {
  printf '%s\n' "$*"
}

cleanup_temp_files() {
  local f
  for f in "${TEMP_FILES[@]}"; do
    [ -n "$f" ] && rm -f "$f" 2>/dev/null || true
  done
}

trap cleanup_temp_files EXIT HUP INT TERM

new_temp_file() {
  local f
  f="$(mktemp "${TMPDIR:-/tmp}/musicapp-startapp.XXXXXX")" || {
    error "Kan geen tijdelijk bestand aanmaken."
    return 1
  }
  TEMP_FILES+=("$f")
  printf '%s\n' "$f"
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
    install|build|test|dev)
      if [ "$ACTION_COUNT" -eq 0 ] || ! contains_action "$action" "${ACTIONS[@]}"; then
        ACTIONS+=("$action")
        ACTION_COUNT=$((ACTION_COUNT + 1))
      fi
      ;;
    all)
      add_action install
      add_action build
      add_action test
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

ensure_runtime_dirs() {
  mkdir -p "$LOG_DIR" || {
    error "Kan logdirectory niet aanmaken: $LOG_DIR"
    return 1
  }
}

cleanup_logs() {
  if [ "$KEEP_DAYS" -eq 0 ]; then
    printf 'Logopschoning overgeslagen (--keep-days 0).\n'
    return 0
  fi

  printf 'Verwijder logbestanden ouder dan %s dagen uit %s\n' "$KEEP_DAYS" "$LOG_DIR"

  # Beperk verwijdering bewust tot gewone .log-bestanden direct in/onder de logmap.
  find "$LOG_DIR" -type f -name '*.log' -mtime "+$KEEP_DAYS" -print -delete
}

detect_git_repo() {
  if command -v git >/dev/null 2>&1 && git -C "$SCRIPT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_REPO=1
  else
    GIT_REPO=0
  fi
}

capture_git_status() {
  local target="$1"

  [ "$GIT_REPO" -eq 1 ] || {
    : > "$target"
    return 0
  }

  git -C "$SCRIPT_DIR" status --porcelain=v1 --untracked-files=all > "$target"
}

initialize_git_guard() {
  [ "$GIT_GUARD" = "1" ] || {
    info "Git-mutatiecontrole: uitgeschakeld."
    return 0
  }

  detect_git_repo

  if [ "$GIT_REPO" -ne 1 ]; then
    warn "Geen Git-worktree gevonden; Git-mutatiecontrole wordt overgeslagen."
    return 0
  fi

  BASELINE_STATUS_FILE="$(new_temp_file)" || return 1
  capture_git_status "$BASELINE_STATUS_FILE" || {
    error "Kan initiële Git-status niet vastleggen."
    return 1
  }

  if [ -s "$BASELINE_STATUS_FILE" ]; then
    warn "Worktree was al gewijzigd vóór startapp. Bestaande wijzigingen worden niet automatisch afgekeurd."
    warn "Startapp bewaakt wel dat de status tijdens de gekozen acties niet verder verandert."
  else
    info "Git-mutatiecontrole: initiële worktree is clean."
  fi
}

verify_git_unchanged() {
  local context="$1"
  local current

  [ "$GIT_GUARD" = "1" ] || return 0
  [ "$GIT_REPO" -eq 1 ] || return 0
  [ -n "$BASELINE_STATUS_FILE" ] || return 0

  current="$(new_temp_file)" || return 1
  capture_git_status "$current" || {
    error "Kan Git-status na '$context' niet bepalen."
    return 1
  }

  if cmp -s "$BASELINE_STATUS_FILE" "$current"; then
    printf "Git-mutatiecontrole na '%s': OK.\n" "$context"
    return 0
  fi

  error "Actie '$context' heeft de Git-worktree gewijzigd."
  printf '\n--- Git-status vóór startapp ---\n' >&2
  if [ -s "$BASELINE_STATUS_FILE" ]; then
    cat "$BASELINE_STATUS_FILE" >&2
  else
    printf '(clean)\n' >&2
  fi

  printf '\n--- Git-status na actie ---\n' >&2
  if [ -s "$current" ]; then
    cat "$current" >&2
  else
    printf '(clean)\n' >&2
  fi

  printf '\n' >&2
  error "Runtime/build/test-acties mogen releasebron niet ongemerkt wijzigen."
  error "Controleer vooral package.json/package-lock.json en gegenereerde output."
  return 90
}

normalize_root() {
  local raw="$1"
  local candidate
  local resolved

  raw="$(printf '%s' "$raw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -n "$raw" ] || return 1

  case "$raw" in
    .) candidate="$SCRIPT_DIR" ;;
    /*) candidate="$raw" ;;
    *) candidate="$SCRIPT_DIR/$raw" ;;
  esac

  [ -d "$candidate" ] || {
    error "npm-root bestaat niet: $candidate"
    return 1
  }

  resolved="$(cd "$candidate" 2>/dev/null && pwd -P)" || {
    error "Kan npm-root niet canonicaliseren: $candidate"
    return 1
  }

  case "$resolved" in
    "$SCRIPT_DIR"|"$SCRIPT_DIR"/*)
      ;;
    *)
      error "npm-root ligt buiten de applicatieroot: $resolved"
      return 1
      ;;
  esac

  printf '%s\n' "$resolved"
}

add_npm_root() {
  local root="$1"
  local item

  for item in "${NPM_ROOTS[@]}"; do
    [ "$item" = "$root" ] && return 0
  done

  NPM_ROOTS+=("$root")
  NPM_ROOT_COUNT=$((NPM_ROOT_COUNT + 1))
}

parse_npm_roots_spec() {
  local list="$1"
  local old_ifs="$IFS"
  local item
  local root

  IFS=','
  for item in $list; do
    IFS="$old_ifs"
    [ -n "$item" ] || { IFS=','; continue; }
    root="$(normalize_root "$item")" || return 1
    add_npm_root "$root"
    IFS=','
  done
  IFS="$old_ifs"
}

discover_npm_roots() {
  local lockfile
  local root

  NPM_ROOTS=()
  NPM_ROOT_COUNT=0

  if [ -n "$NPM_ROOTS_SPEC" ]; then
    parse_npm_roots_spec "$NPM_ROOTS_SPEC" || return 1
  elif [ "$GIT_REPO" -eq 1 ]; then
    # Alleen tracked lockfiles gelden automatisch als deploybare npm-roots.
    while IFS= read -r lockfile; do
      case "$lockfile" in
        package-lock.json|*/package-lock.json)
          case "$lockfile" in
            */node_modules/*) continue ;;
          esac
          root="$(dirname "$SCRIPT_DIR/$lockfile")"
          root="$(cd "$root" 2>/dev/null && pwd -P)" || continue
          add_npm_root "$root"
          ;;
      esac
    done <<EOF
$(git -C "$SCRIPT_DIR" ls-files)
EOF
  fi

  # Fallback voor een niet-Git omgeving.
  if [ "$NPM_ROOT_COUNT" -eq 0 ] && [ -f "$SCRIPT_DIR/package-lock.json" ]; then
    add_npm_root "$SCRIPT_DIR"
  fi

  if [ "$NPM_ROOT_COUNT" -eq 0 ]; then
    error "Geen npm-root met package-lock.json gevonden."
    error "Gebruik --npm-roots of zorg dat package-lock.json tracked is."
    return 1
  fi

  for root in "${NPM_ROOTS[@]}"; do
    [ -f "$root/package.json" ] || {
      error "Geen package.json bij npm-root: $root"
      return 1
    }
    [ -f "$root/package-lock.json" ] || {
      error "Geen package-lock.json bij npm-root: $root"
      return 1
    }
  done
}

root_label() {
  local root="$1"
  local rel

  if [ "$root" = "$SCRIPT_DIR" ]; then
    printf 'root\n'
    return 0
  fi

  rel=${root#"$SCRIPT_DIR"/}
  printf '%s\n' "$rel" | tr '/ ' '__'
}

run_npm_ci_root() {
  local root="$1"
  local label
  local timestamp
  local logfile
  local status

  label="$(root_label "$root")"
  timestamp="$(date '+%Y%m%d-%H%M%S')"
  logfile="$LOG_DIR/npm-ci-${label}-${timestamp}.log"

  printf '\n============================================================\n'
  printf 'Start: install (npm ci)\n'
  printf 'npm-root: %s\n' "$root"
  printf 'Logbestand: %s\n' "$logfile"
  printf '============================================================\n'

  (
    cd "$root" || exit 1
    npm ci
  ) 2>&1 | tee "$logfile"
  status=${PIPESTATUS[0]}

  if [ "$status" -ne 0 ]; then
    error "npm ci is mislukt in '$root' met exitcode $status. Zie: $logfile"
    return "$status"
  fi

  printf "npm ci succesvol afgerond voor '%s'.\n" "$root"
  return 0
}

run_install_ci() {
  local root
  local status

  discover_npm_roots || return 1

  printf '\nGevonden npm-roots:\n'
  for root in "${NPM_ROOTS[@]}"; do
    printf '  - %s\n' "$root"
  done

  for root in "${NPM_ROOTS[@]}"; do
    if run_npm_ci_root "$root"; then
      :
    else
      status=$?
      return "$status"
    fi
  done

  return 0
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

run_install_action() {
  case "$INSTALL_MODE" in
    ci)
      run_install_ci
      ;;
    legacy)
      warn "Legacy installatiemodus actief: npm run install:all."
      warn "Deze modus kan package-lock.json wijzigen en is alleen bedoeld voor overgang."
      run_npm_task "install" "install:all" "npm-install-all"
      ;;
    *)
      error "Ongeldige installatiemodus: $INSTALL_MODE (gebruik ci of legacy)"
      return 2
      ;;
  esac
}

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
    --install-mode)
      [ "$#" -ge 2 ] || { error "Waarde ontbreekt na $1"; exit 2; }
      INSTALL_MODE="$2"
      shift 2
      ;;
    --install-mode=*)
      INSTALL_MODE=${1#*=}
      shift
      ;;
    --npm-roots)
      [ "$#" -ge 2 ] || { error "Waarde ontbreekt na $1"; exit 2; }
      NPM_ROOTS_SPEC="$2"
      shift 2
      ;;
    --npm-roots=*)
      NPM_ROOTS_SPEC=${1#*=}
      shift
      ;;
    --no-git-guard)
      GIT_GUARD=0
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
    -*)
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

case "$INSTALL_MODE" in
  ci|legacy) ;;
  *)
    error "--install-mode moet 'ci' of 'legacy' zijn."
    exit 2
    ;;
esac

case "$GIT_GUARD" in
  0|1) ;;
  *)
    error "STARTAPP_GIT_GUARD moet 0 of 1 zijn."
    exit 2
    ;;
esac

if [ "$ACTION_COUNT" -eq 0 ]; then
  error "Geef minimaal één commando op: install, build, test, dev of all."
  usage >&2
  exit 2
fi

command -v npm >/dev/null 2>&1 || { error "npm is niet gevonden in PATH."; exit 127; }
command -v tee >/dev/null 2>&1 || { error "tee is niet gevonden in PATH."; exit 127; }
command -v cmp >/dev/null 2>&1 || { error "cmp is niet gevonden in PATH."; exit 127; }

[ -f "$SCRIPT_DIR/package.json" ] || {
  error "Geen package.json gevonden in $SCRIPT_DIR"
  exit 1
}

cd "$SCRIPT_DIR" || {
  error "Kan niet naar scriptdirectory: $SCRIPT_DIR"
  exit 1
}

ensure_runtime_dirs || exit 1
initialize_git_guard || exit 1
cleanup_logs || exit 1

# Ook logcleanup/runtime-initialisatie mag tracked source niet wijzigen.
verify_git_unchanged "runtime-initialisatie" || exit $?

ORDERED_ACTIONS="install build test dev"
OVERALL_STATUS=0

for action in $ORDERED_ACTIONS; do
  contains_action "$action" "${ACTIONS[@]}" || continue

  case "$action" in
    install)
      if run_install_action; then
        :
      else
        status=$?
        OVERALL_STATUS=$status
        if [ "$CONTINUE_ON_ERROR" -eq 0 ]; then
          exit "$status"
        fi
        continue
      fi
      ;;
    build)
      if run_npm_task "build" "build" "npm-build-all"; then
        :
      else
        status=$?
        OVERALL_STATUS=$status
        if [ "$CONTINUE_ON_ERROR" -eq 0 ]; then
          exit "$status"
        fi
        continue
      fi
      ;;
    test)
      if run_npm_task "test" "test:all" "test-all"; then
        :
      else
        status=$?
        OVERALL_STATUS=$status
        if [ "$CONTINUE_ON_ERROR" -eq 0 ]; then
          exit "$status"
        fi
        continue
      fi
      ;;
    dev)
      if run_npm_task "dev" "dev" "dev"; then
        :
      else
        status=$?
        OVERALL_STATUS=$status
        if [ "$CONTINUE_ON_ERROR" -eq 0 ]; then
          exit "$status"
        fi
        continue
      fi
      ;;
  esac

  if verify_git_unchanged "$action"; then
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
