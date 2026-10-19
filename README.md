# 🚩 FlagForge

> **Zero-Latency Feature Flagging, Canary Rollout & Remote Config Engine**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

FlagForge enables development teams to decouple software deployment from feature release. Toggle kill-switches, conduct gradual percentage rollouts (canary releases), and target users by attributes—all evaluated locally in **0.001ms** with zero network round-trips.

---

## 🚀 Key Features

* **Sub-Millisecond Evaluation:** Flags are evaluated client-side via memory cache using a pure 32-bit FNV-1a deterministic hash. Zero network latency.
* **Instant Remote Kill-Switch:** Disable buggy code on production in under 50ms without redeploying.
* **Gradual Canary Rollouts:** Safely ramp new features from 5% $\rightarrow$ 25% $\rightarrow$ 100% of your audience.
* **Granular User Targeting:** Route flags based on user attributes (`email`, `tier`, `role`, `country`).
* **Multi-Environment Support:** Manage flags independently across Development, Staging, and Production.
* **Full Audit Trail & 1-Click Rollback:** Immutable history of every flag state transition with instant rollback capability.
* **Multi-Platform SDKs:** Drop-in hooks for React (`useFlag`), Node.js, Python, and cURL.

---

## 🛠️ Quickstart

```bash
# Clone the repository
git clone https://github.com/TaskinXZ/FlagForge.git
cd FlagForge

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📦 Build & Deploy

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

Deployable to Vercel or Netlify with zero configuration (`npm run build` outputs to `dist/`).
