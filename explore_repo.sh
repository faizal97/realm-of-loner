#!/bin/bash
cd /tmp && git clone https://api.github.com/repos/faizal97/realm-of-loner 2>/dev/null || true
# Let's try direct clone
git clone https://github.com/faizal97/realm-of-loner.git /tmp/realm-of-loner 2>&1
ls /tmp/realm-of-loner/
