#!/bin/zsh
# check.sh NN : fidelity + selftest for one built lesson
NN=$1; SP=${0:A:h}; ROOT=${SP:h:h}
MD=$(cd "$ROOT"; ls ${NN}\ *.md); HT=$(cd "$ROOT/interactive/lessons"; ls ${NN}-*.html)
ADD=""; [[ -f $SP/added-$NN.md ]] && ADD=$SP/added-$NN.md
(cd "$ROOT/interactive" && python3 $SP/fidelity.py "$ROOT/$MD" "lessons/$HT" $ADD | tail -3)
P=$(mktemp -d ${TMPDIR:-/tmp}/chprof-XXXXXX)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir=$P --virtual-time-budget=20000 --dump-dom "file://$ROOT/interactive/lessons/$HT?selftest" 2>/dev/null | grep -o 'SELFTEST[^<]*' | head -20
rm -rf $P
