#!/bin/bash
cd "$(dirname "$0")"
node generate.js local
open index.html
