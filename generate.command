#!/bin/bash
cd "$(dirname "$0")"
node generate.js
open index.html
