#!/bin/bash
# Records what the REAL compilers print for every program in tests/corpus,
# so tests/corpus.test.ts can check that AlgoScope prints exactly the same.
# Needs gcc, g++, python3, and a JDK + .NET SDK (conda env "refcomp" by default).
set -u
cd "$(dirname "$0")/../tests/corpus"
REF=${REF:-$HOME/miniconda3/envs/refcomp}
JAVAC=$REF/bin/javac; JAVA=$REF/bin/java
DOTNET=$REF/lib/dotnet/dotnet
SDK=$(ls -d $REF/lib/dotnet/sdk/*/ | head -1)
REFS=$(ls -d $REF/lib/dotnet/packs/Microsoft.NETCore.App.Ref/*/ref/net*/ | head -1)
RTVER=$(ls $REF/lib/dotnet/shared/Microsoft.NETCore.App/ | head -1)
TMP=$(mktemp -d)
only=${1:-}
for f in */*.*; do
  case "$f" in *.out|*.in) continue;; esac
  [ -n "$only" ] && [[ "$f" != *"$only"* ]] && continue
  dir=$(dirname "$f"); base=$(basename "$f"); ext="${base##*.}"; stem="${base%.*}"
  out="$dir/$stem.$ext.out"; in="$dir/$stem.in"; [ -f "$in" ] || in=/dev/null
  rm -rf "$TMP"/*; ok=1
  case "$ext" in
    c)   gcc -std=c11 -w -o "$TMP/a" "$f" -lm && "$TMP/a" < "$in" > "$out" || ok=0 ;;
    cpp) g++ -std=c++17 -w -o "$TMP/a" "$f" && "$TMP/a" < "$in" > "$out" || ok=0 ;;
    py)  python3 "$f" < "$in" > "$out" || ok=0 ;;
    java) cp "$f" "$TMP/Main.java" && (cd "$TMP" && $JAVAC Main.java 2>&1) && $JAVA -cp "$TMP" Main < "$in" > "$out" || ok=0 ;;
    cs)
      $DOTNET "$SDK/Roslyn/bincore/csc.dll" -nologo -nowarn:CS0168,CS0219,CS8981 -out:"$TMP/p.dll" $(for r in "$REFS"*.dll; do echo "-r:$r"; done) "$f" >"$TMP/log" 2>&1 || { cat "$TMP/log"; ok=0; }
      if [ $ok = 1 ]; then
        printf '{"runtimeOptions":{"tfm":"net10.0","framework":{"name":"Microsoft.NETCore.App","version":"%s"}}}' "$RTVER" > "$TMP/p.runtimeconfig.json"
        $DOTNET exec --runtimeconfig "$TMP/p.runtimeconfig.json" "$TMP/p.dll" < "$in" > "$out" || ok=0
      fi ;;
  esac
  [ $ok = 1 ] && echo "ok   $f" || { echo "FAIL $f"; rm -f "$out"; }
done
rm -rf "$TMP"
