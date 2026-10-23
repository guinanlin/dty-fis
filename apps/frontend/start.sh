#!/bin/bash

bun --bun run dev --port 3656 &

bun watcher.js

wait
