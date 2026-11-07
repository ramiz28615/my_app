#!/usr/bin/env bash
set -euo pipefail

numbers="1 2 3 4 5"
if [ -f code-lab/shared/numbers.txt ]; then
  numbers=$(cat code-lab/shared/numbers.txt)
fi
count=0
total=0
for n in $numbers; do
  [[ $n =~ ^-?[0-9]+$ ]] || { printf '%s\n' "Invalid number" >&2; exit 1; }
  total=$((total+n))
  count=$((count+1))
done
printf '%s\n' "Merhaba Dimensia Bash!"
printf 'Toplam: %s\n' "$total"
printf 'DIMENSIA_RESULT:{"count":%s,"sum":%s}\n' "$count" "$total"
