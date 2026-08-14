<div align="center">

# 📸 InstaFlow — Instagram DM & Comment Automation Platform

**A full-stack SaaS platform for automating Instagram comment replies and DMs, with a visual flow builder, AI-powered responses, and subscription billing.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe)](https://stripe.com/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI-412991?logo=openai)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Demo Video](#-demo) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Known Limitations](#-known-limitations) · [Local Setup](#-local-setup)

</div>

---

## 🎬 Demo

> Live testing requires a Meta-approved app + added test users (see [Known Limitations](#-known-limitations) below), so the fastest way to see it in action is the walkthrough video.

**▶️ [Watch the demo video](#)** — connecting an Instagram account, building an automation, and seeing a live comment trigger a DM.

**🔗 Source code:** [github.com/AnasNihal/Matirial-ui](https://github.com/AnasNihal/Matirial-ui)

<div align="center">
  <img src="./public/mation-image.jpg" alt="Automation builder screenshot" width="800"/>
</div>

---

## ✨ Features

- **Visual automation builder** — a node-based flow editor (trigger → condition → action) for designing comment/DM automations without writing rules by hand
- **Keyword-triggered responses** — listen for specific keywords in comments or DMs and fire an automated reply
- **AI-powered replies (Smart AI)** — OpenAI-backed responses that adapt to the conversation instead of a fixed script
- **Rich media in DMs** — send images and links as part of an automated direct message, not just plain text
- **Instagram OAuth integration** — connect a creator's Instagram Business account and manage the connection from a settings panel
- **Real-time analytics dashboard** — track automation performance, response counts, and account metrics with `recharts`
- **Subscription billing** — Stripe-powered plan upgrades and payment handling
- **Auth & session management** — Clerk-based sign in/sign up, protected routes via middleware
- **Dark/light theme**, responsive layout, and a full component library built on shadcn/ui + Radix primitives

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router), TypeScript |
| **Styling / UI** | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **State / Data** | Redux Toolkit, TanStack React Query |
| **Database / ORM** | PostgreSQL, Prisma |
| **Auth** | Clerk |
| **Payments** | Stripe |
| **AI** | OpenAI API |
| **Integration** | Meta Graph API (Instagram Business) |
| **Charts** | Recharts |
| **Forms / Validation** | React Hook Form, Zod |

---

## 🏗 Architecture

```
src/
├── app/
│   ├── (auth)/            # Sign-in / sign-up (Clerk)
│   ├── (protected)/
│   │   ├── api/           # Webhook, payment, dm-image routes
│   │   ├── callback/      # Instagram OAuth callback
│   │   └── dashboard/     # Main app: automations, integrations, settings
│   └── (website)/         # Public landing page
├── actions/                # Server actions (queries/mutations per domain)
├── components/
│   ├── global/              # Feature components (automation builder, billing, sidebar…)
│   └── ui/                  # shadcn/ui primitives
├── lib/                     # Prisma client, Graph API calls, Stripe, OpenAI
├── redux/, providers/, hooks/
└── prisma/schema.prisma     # Users, Integrations, Automations, Listeners, DM history
```

**Flow for an automated reply:**
1. Instagram sends a webhook event (comment/DM) to `/api/webhook/instagram`
2. The event is matched against active automations and keyword listeners for that account
3. A response is generated (static text, rich media, or an OpenAI-generated reply)
4. The reply is sent back via the Meta Graph API using the connected account's access token

---

## ⚠️ Known Limitations

Being upfront about this rather than shipping a broken "Live Demo" button:

- **Meta App Review**: this app hasn't gone through Meta's App Review process (requires business verification and can take weeks), so it's running in Development Mode — only Instagram accounts explicitly added as testers in the Meta App Dashboard can complete OAuth. That's why there's no public live demo; watch the video instead.
- **Token refresh**: long-lived token exchange and automatic refresh is partially implemented — see the demo video for a working connected-account flow.
- **Single-page webhook binding**: the current webhook handler is wired to one Facebook Page ID rather than resolving it dynamically per connected account.

Fixing the above is on the roadmap — see [Issues](https://github.com/AnasNihal/Matirial-ui/issues).

---

## 💻 Local Setup

```bash
# 1. Clone
git clone https://github.com/AnasNihal/Matirial-ui.git
cd Matirial-ui

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, Clerk keys, Stripe keys, Instagram/Meta app credentials, OpenAI key

# 4. Set up the database
npx prisma migrate dev

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> To test Instagram webhooks locally, you'll need a tunneling tool (e.g. ngrok) to expose your local server to Meta, and your own Meta Developer app with Instagram Business API access.

---

## 📄 License

This project began from a licensed UI/course template (educational + portfolio use) and has been extended with custom automation logic, AI-powered replies, database architecture, and bug fixes. Not for commercial redistribution — see [license terms](https://webprodigies.com/license).

---

<div align="center">

Built by **[Anas Nihal](https://github.com/AnasNihal)**

</div>
