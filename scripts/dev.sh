#!/usr/bin/env bash
set -eo pipefail

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repository_root"

NVM_DIR=${NVM_DIR:-"$HOME/.nvm"}
GVM_ROOT=${GVM_ROOT:-"$HOME/.gvm"}
fingerprint_file=node_modules/.pi-setup-fingerprint

# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"
nvm use
# shellcheck disable=SC1090
set +e
. "$GVM_ROOT/scripts/gvm"
gvm_source_status=$?
# shellcheck disable=SC1091
. ./.gvmrc
gvm_use_status=$?
set -e
if ((gvm_source_status != 0 || gvm_use_status != 0)); then
  printf '%s\n' "Unable to activate the Go toolchain from .gvmrc." >&2
  exit 1
fi

fingerprint=$(cat .nvmrc .gvmrc package-lock.json | shasum -a 256 | awk '{print $1}')
if [ ! -f "$fingerprint_file" ] || [ "$(cat "$fingerprint_file")" != "$fingerprint" ]; then
  npm ci --ignore-scripts --no-audit --no-fund
  printf '%s\n' "$fingerprint" > "$fingerprint_file"
fi

exec npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e . \
  "$@"
