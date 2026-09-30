#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  Setting up AmiBroker Web Platform on macOS / Linux"
echo "========================================================"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org or via brew: brew install node"
    exit 1
fi

echo "Installing npm dependencies..."
npm install

echo "========================================================"
echo "  Launching AmiBroker Web on http://localhost:3000"
echo "========================================================"
npm run dev
