#!/bin/bash
find src -name "*.tsx" -o -name "*.ts" | xargs -I {} sed -i '' \
  -e 's/shadow-gold-lg/shadow-sm/g' \
  -e 's/shadow-2xl/shadow-sm/g' \
  -e 's/shadow-gold/shadow-sm/g' \
  -e 's/shadow-emerald/shadow-sm/g' \
  -e 's/shadow-blue/shadow-sm/g' \
  -e 's/animate-glow-gold//g' \
  -e 's/animate-glow-emerald//g' \
  -e 's/emerald-border-glow//g' \
  -e 's/gold-border-glow//g' \
  -e 's/font-display font-black/font-semibold/g' \
  -e 's/rounded-3xl/rounded-[24px]/g' \
  -e 's/rounded-2xl/rounded-[16px]/g' \
  -e 's/rounded-xl/rounded-[12px]/g' \
  -e 's/active:scale-95/active:scale-[0.98]/g' \
  -e 's/border-navy-800\/80/border-white\/[0.07]/g' \
  -e 's/border-navy-800/border-white\/[0.07]/g' \
  {}
