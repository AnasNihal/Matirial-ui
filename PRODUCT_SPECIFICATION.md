# Product Specification Document: Mation

## 1. Executive Summary

**Product Name:** Mation  
**Version:** 0.1.0  
**Product Type:** Instagram Automation Platform (SaaS)  
**Target Audience:** Instagram creators, businesses, and marketers looking to automate engagement and customer interactions

Mation is an Instagram automation platform that enables users to automatically respond to comments and direct messages based on keyword triggers. The platform offers both manual message responses and AI-powered intelligent responses, helping users increase engagement, convert followers to customers, and scale their Instagram presence.

---

## 2. Product Overview

### 2.1 Vision Statement
To empower Instagram creators and businesses to automate customer engagement, increase conversion rates, and scale their social media presence through intelligent automation.

### 2.2 Mission Statement
Provide a seamless, user-friendly platform that automates Instagram interactions while maintaining authentic engagement through customizable responses and AI-powered conversations.

### 2.3 Core Value Propositions
- **Automated Engagement:** Respond to comments and DMs instantly, 24/7
- **Keyword-Based Triggers:** Target specific keywords to deliver relevant responses
- **AI-Powered Responses:** Smart AI feature for intelligent, context-aware replies (Pro feature)
- **Rich Media Support:** Send images, links, and formatted messages in automated responses
- **Analytics & Tracking:** Monitor engagement metrics and automation performance
- **Easy Integration:** Simple Instagram account connection via Meta Graph API

---

## 3. Product Features

### 3.1 User Authentication & Onboarding
- **Authentication Provider:** Clerk
  - Email-based sign-up and sign-in
  - Secure session management
  - User profile management (firstname, lastname, email)

### 3.2 Instagram Integration
- **Integration Type:** Instagram via Meta Graph API (v24.0)
- **Features:**
  - OAuth-based Instagram account connection
  - Long-lived token management with automatic refresh
  - Page access token handling
  - Instagram profile data sync:
    - Instagram ID
    - Username
    - Profile picture
  - Post fetching and management
  - Webhook subscription for real-time events

### 3.3 Automation System

#### 3.3.1 Automation Triggers
Users can create automations triggered by:

1. **Comment Triggers**
   - Trigger: User comments on a post
   - Keyword matching: Case-insensitive keyword detection
   - Post-specific: Automations are tied to specific Instagram posts
   - Multiple keywords per automation supported

2. **Direct Message (DM) Triggers**
   - Trigger: User sends a DM containing a keyword
   - Keyword matching: Case-insensitive keyword detection
   - Profile-wide: Works across all DMs, not post-specific

#### 3.3.2 Automation Listeners (Response Types)

1. **MESSAGE Listener** (Available on Free & Pro Plans)
   - **Features:**
     - Custom message responses
     - Public comment replies (visible under post)
     - Private DM responses (sent directly to user)
     - Rich media support:
       - Image attachments (via URL or base64)
       - Link attachments with titles
       - Combined image + text + links
     - JSON-based configuration for complex responses
   - **Response Flow:**
     - Step 1: Send public reply to comment (optional)
     - Step 2: Send private DM with image (if configured)
     - Step 3: Send text message with links (if configured)

2. **SMARTAI Listener** (Pro Plan Only)
   - **Features:**
     - AI-powered response generation using OpenAI GPT-4o
     - Context-aware conversations
     - System prompt customization
     - Conversation history tracking
     - Automatic continuation of conversations
     - Response length optimization (under 2 sentences)

#### 3.3.3 Automation Management
- **Automation States:**
  - Active: Automation is running and monitoring for triggers
  - Inactive: Automation is paused/disabled
- **Automation Properties:**
  - Custom name (default: "Untitled")
  - Multiple keywords per automation
  - Multiple posts per automation
  - Multiple triggers per automation
  - Response tracking (DM count, comment count)
  - Creation timestamp

### 3.4 Webhook System
- **Webhook Endpoints:**
  - GET: Webhook verification (Meta webhook subscription)
  - POST: Event processing (comments, DMs)
- **Event Types Handled:**
  - Comment events (new comments on posts)
  - Direct message events (incoming DMs)
  - Echo message filtering (prevents loop responses)
- **Processing Flow:**
  1. Receive webhook event from Meta
  2. Validate event type and data
  3. Extract keyword from comment/DM text
  4. Match keyword against active automations
  5. Verify post association (for comments)
  6. Execute automation listener (MESSAGE or SMARTAI)
  7. Track response metrics
  8. Store chat history (for SMARTAI)

### 3.5 Dashboard & User Interface

#### 3.5.1 Main Dashboard
- **Overview Metrics:**
  - Total DMs sent
  - Total comments replied to
  - Active automations count
  - Engagement growth percentage
- **Quick Actions:**
  - Create new automation
  - View all automations
  - Integration status
- **Onboarding States:**
  - New user guidance (no integrations)
  - First automation setup wizard
  - Integration connection prompts

#### 3.5.2 Automations Page
- **Automation List View:**
  - Grid/list view of all automations
  - Automation status indicators (active/inactive)
  - Quick stats per automation
  - Edit/delete actions
- **Automation Detail View:**
  - Automation configuration
  - Associated posts
  - Keywords list
  - Trigger types
  - Listener configuration
  - Response statistics
  - Edit automation builder

#### 3.5.3 Automation Builder
- **Step-by-Step Creation:**
  1. **Name Automation:** Custom name input
  2. **Select Trigger:** Choose COMMENT or DM trigger
  3. **Add Keywords:** Multiple keyword input with validation
  4. **Select Posts:** (For COMMENT triggers) Choose Instagram posts to monitor
  5. **Choose Listener:** Select MESSAGE or SMARTAI
  6. **Configure Response:**
     - MESSAGE: Enter message text, optional image, optional links, optional public reply
     - SMARTAI: Enter system prompt/instructions
  7. **Activate:** Toggle automation on/off

#### 3.5.4 Integrations Page
- **Integration Status:**
  - Connected Instagram account display
  - Profile information (username, profile picture)
  - Token expiration status
  - Reconnect option
- **Integration Flow:**
  - OAuth redirect to Instagram
  - Token exchange and storage
  - Profile data sync
  - Webhook subscription setup

#### 3.5.5 Settings Page
- User profile management
- Account settings
- Subscription management

### 3.6 Subscription & Billing

#### 3.6.1 Subscription Plans

**Free Plan:**
- Basic automation features
- MESSAGE listener (manual responses)
- Keyword-based triggers
- Comment and DM automation
- Limited automations (if applicable)
- Basic analytics

**Pro Plan ($99/month):**
- All Free Plan features
- SMARTAI listener (AI-powered responses)
- Unlimited automations
- Priority customer support
- Custom branding options (if applicable)
- Advanced analytics

#### 3.6.2 Payment Integration
- **Payment Provider:** Stripe
- **Features:**
  - Secure checkout flow
  - Session-based subscription creation
  - Customer ID management
  - Subscription status tracking
  - Plan upgrade/downgrade handling

### 3.7 Analytics & Metrics

#### 3.7.1 Automation Metrics
- **Per Automation:**
  - DM count (total DMs sent)
  - Comment count (total comments replied to)
  - Automation status
  - Creation date

#### 3.7.2 Dashboard Metrics
- Total DMs across all automations
- Total comments across all automations
- Active automations count
- Engagement growth calculation
- Monthly/weekly trends (if implemented)

### 3.8 Data Models

#### 3.8.1 User Model
- UUID primary key
- Clerk ID (unique)
- Email (unique)
- Firstname, Lastname
- Created timestamp
- Relations: Subscription, Integrations, Automations

#### 3.8.2 Subscription Model
- UUID primary key
- User relation (one-to-one)
- Plan type (FREE, PRO)
- Stripe customer ID
- Created/updated timestamps

#### 3.8.3 Integration Model
- UUID primary key
- Integration type (INSTAGRAM)
- Access token (encrypted/unique)
- Token expiration date
- Instagram ID, username, profile picture
- User relation

#### 3.8.4 Automation Model
- UUID primary key
- Name
- Active status (boolean)
- Created timestamp
- Relations: Triggers, Listener, Posts, DMs, Keywords, User

#### 3.8.5 Keyword Model
- UUID primary key
- Keyword word (case-insensitive matching)
- Automation relation
- Unique constraint: (automationId, word)

#### 3.8.6 Trigger Model
- UUID primary key
- Trigger type (COMMENT, DM)
- Automation relation

#### 3.8.7 Listener Model
- UUID primary key
- Listener type (MESSAGE, SMARTAI)
- Prompt/message content
- Comment reply configuration (JSON or text)
- DM count, comment count
- Automation relation (one-to-one)

#### 3.8.8 Post Model
- UUID primary key
- Instagram post ID
- Caption
- Media URL
- Media type (IMAGE, VIDEO, CAROUSEL_ALBUM)
- Automation relation

#### 3.8.9 DM Model
- UUID primary key
- Sender ID
- Receiver ID
- Message content
- Created timestamp
- Automation relation

---

## 4. Technical Architecture

### 4.1 Technology Stack

#### 4.1.1 Frontend
- **Framework:** Next.js 14.2.7 (React 18)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.1
- **UI Components:** Radix UI primitives
- **State Management:**
  - React Query (TanStack Query) for server state
  - Redux Toolkit for client state
- **Form Management:** React Hook Form with Zod validation
- **Animations:** Framer Motion
- **Icons:** Lucide React

#### 4.1.2 Backend
- **Runtime:** Node.js
- **API Framework:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma 5.22.0
- **Authentication:** Clerk 6.4.0

#### 4.1.3 External Services
- **Instagram/Meta API:** Graph API v24.0
- **AI Service:** OpenAI (GPT-4o)
- **Payment Processing:** Stripe
- **File Storage:** Local filesystem (for DM images)

#### 4.1.4 Development Tools
- **Package Manager:** npm/bun
- **Linting:** ESLint with Next.js config
- **Build Tool:** Next.js built-in

### 4.2 System Architecture

#### 4.2.1 Application Structure
```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication routes
│   ├── (protected)/       # Protected dashboard routes
│   │   ├── api/          # API endpoints
│   │   │   ├── webhook/  # Instagram webhook handler
│   │   │   ├── payment/  # Stripe payment handling
│   │   │   └── dm-image/ # Image serving endpoint
│   │   └── dashboard/    # Dashboard pages
│   └── (website)/        # Public marketing pages
├── components/            # React components
│   ├── global/           # App-wide components
│   └── ui/               # Reusable UI primitives
├── actions/              # Server actions
│   ├── automations/      # Automation CRUD
│   ├── integrations/     # Integration management
│   ├── user/             # User operations
│   └── webhook/          # Webhook queries
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
│   ├── fetch.ts          # Instagram API client
│   ├── openai.ts         # OpenAI client
│   ├── prisma.ts         # Prisma client
│   └── stripe.ts         # Stripe client
├── redux/                # Redux store
└── types/                # TypeScript types
```

#### 4.2.2 Data Flow

**Automation Creation Flow:**
1. User fills automation builder form
2. Form validation (Zod)
3. Server action creates automation in database
4. React Query cache invalidation
5. UI updates with new automation

**Webhook Event Flow:**
1. Meta sends webhook event to `/api/webhook/instagram`
2. Webhook handler validates event
3. Keyword matching against active automations
4. Automation listener execution:
   - MESSAGE: Send configured response
   - SMARTAI: Generate AI response, send, store history
5. Metrics tracking (update DM/comment counts)
6. Return 200 status to Meta

**Instagram Integration Flow:**
1. User clicks "Connect Instagram"
2. Redirect to Instagram OAuth
3. User authorizes app
4. OAuth callback receives authorization code
5. Exchange code for access token
6. Store token in database
7. Fetch Instagram profile data
8. Set up webhook subscription
9. Redirect to integrations page

### 4.3 API Endpoints

#### 4.3.1 Webhook Endpoint
- **Route:** `/api/webhook/instagram`
- **Methods:**
  - `GET`: Webhook verification (Meta subscription)
  - `POST`: Event processing
- **Authentication:** Webhook verify token (environment variable)

#### 4.3.2 Payment Endpoint
- **Route:** `/api/payment`
- **Method:** POST
- **Purpose:** Create Stripe checkout session

#### 4.3.3 Image Serving Endpoint
- **Route:** `/api/dm-image/[automationId]`
- **Method:** GET
- **Purpose:** Serve DM images for Instagram API

### 4.4 Database Schema
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Key Relationships:**
  - User → Subscription (1:1)
  - User → Integrations (1:many)
  - User → Automations (1:many)
  - Automation → Triggers (1:many)
  - Automation → Listener (1:1)
  - Automation → Posts (1:many)
  - Automation → Keywords (1:many)
  - Automation → DMs (1:many)

### 4.5 Security Considerations
- **Authentication:** Clerk-managed sessions
- **API Security:** Webhook token verification
- **Token Storage:** Encrypted database storage
- **Token Refresh:** Automatic long-lived token refresh
- **Rate Limiting:** (Should be implemented for production)
- **Input Validation:** Zod schema validation
- **SQL Injection:** Prisma ORM protection
- **XSS Protection:** React's built-in escaping

---

## 5. User Stories & Use Cases

### 5.1 Primary User Personas

**Persona 1: Instagram Creator**
- Goal: Increase engagement and convert followers to customers
- Pain Point: Can't respond to all comments/DMs manually
- Solution: Automated keyword-based responses

**Persona 2: E-commerce Business**
- Goal: Provide instant customer support and product information
- Pain Point: High volume of inquiries, need 24/7 availability
- Solution: Automated responses with product links and images

**Persona 3: Service Provider**
- Goal: Qualify leads and schedule consultations
- Pain Point: Manual lead qualification is time-consuming
- Solution: AI-powered responses that answer questions and collect information

### 5.2 Key User Flows

#### 5.2.1 New User Onboarding
1. User signs up via Clerk
2. User lands on dashboard
3. System prompts to connect Instagram
4. User connects Instagram account
5. System prompts to create first automation
6. User creates automation via builder
7. User activates automation

#### 5.2.2 Creating a Comment Automation
1. User navigates to Automations page
2. User clicks "Create Automation"
3. User names automation (e.g., "Product Inquiry")
4. User selects "User comments on my post" trigger
5. User adds keywords (e.g., "price", "cost", "buy")
6. User selects Instagram posts to monitor
7. User selects "Send the user a message" listener
8. User configures response:
   - Public reply: "Thanks for your interest! Check your DMs 💬"
   - Private DM: Product information with image and links
9. User activates automation
10. System starts monitoring selected posts for keywords

#### 5.2.3 Creating a DM Automation
1. User creates new automation
2. User selects "User sends me a DM with a keyword" trigger
3. User adds keywords (e.g., "hello", "info", "help")
4. User selects listener (MESSAGE or SMARTAI)
5. User configures response
6. User activates automation
7. System monitors all incoming DMs for keywords

#### 5.2.4 Upgrading to Pro Plan
1. User navigates to Settings or sees upgrade prompt
2. User clicks "Upgrade to Pro"
3. User redirected to Stripe checkout
4. User completes payment
5. Stripe webhook updates subscription status
6. User gains access to SMARTAI features
7. User can now use AI-powered responses

---

## 6. Performance & Scalability

### 6.1 Performance Optimizations
- **React Query Caching:**
  - Aggressive caching (30-minute stale time)
  - Infinite garbage collection time
  - Placeholder data for instant UI updates
  - Background refetching
- **Database Optimizations:**
  - Indexed fields (user IDs, automation IDs, keywords)
  - Unique constraints to prevent duplicates
  - Efficient query patterns
- **Image Handling:**
  - Base64 to URL conversion for Instagram API
  - Dynamic image serving endpoint
  - Support for multiple hosting environments (ngrok, Vercel, production)

### 6.2 Scalability Considerations
- **Webhook Processing:**
  - Asynchronous event processing
  - Error handling to prevent retry loops
  - Always return 200 to Meta to prevent retries
- **Database:**
  - Connection pooling (Prisma)
  - Efficient indexing strategy
  - Cascade deletes for data cleanup
- **API Rate Limits:**
  - Instagram Graph API rate limit awareness
  - Token refresh handling
  - Error recovery mechanisms

---

## 7. Future Enhancements

### 7.1 Planned Features
- **Multi-Platform Support:**
  - Facebook integration
  - Twitter/X integration
  - TikTok integration
- **Advanced Analytics:**
  - Response time metrics
  - Conversion tracking
  - Engagement rate analysis
  - Custom date range reports
- **Enhanced AI Features:**
  - Custom AI model training
  - Multi-language support
  - Sentiment analysis
  - Intent classification
- **Workflow Automation:**
  - Multi-step automation flows
  - Conditional logic
  - Integration with CRM systems
  - Email notifications
- **Team Collaboration:**
  - Multi-user accounts
  - Role-based permissions
  - Team analytics
- **Advanced Media:**
  - Video message support
  - Carousel message support
  - Interactive buttons and quick replies

### 7.2 Technical Improvements
- **Monitoring & Logging:**
  - Comprehensive error tracking
  - Performance monitoring
  - Webhook event logging
- **Testing:**
  - Unit tests
  - Integration tests
  - E2E tests
- **Documentation:**
  - API documentation
  - User guides
  - Developer documentation

---

## 8. Compliance & Legal

### 8.1 Instagram/Meta Compliance
- **API Usage:** Compliant with Instagram Graph API terms
- **Webhook Subscription:** Proper webhook verification
- **Rate Limits:** Respecting API rate limits
- **Data Privacy:** Secure token storage and handling

### 8.2 Data Privacy
- **User Data:** Stored securely in PostgreSQL
- **Token Encryption:** Access tokens encrypted in database
- **GDPR Considerations:** (Should be implemented for EU users)
- **Data Retention:** Configurable data retention policies

### 8.3 Terms of Service
- **License:** Educational use only (per README)
- **Commercial Use:** Requires license purchase
- **Usage Restrictions:** See README for detailed restrictions

---

## 9. Success Metrics

### 9.1 Product Metrics
- **User Acquisition:**
  - Sign-up conversion rate
  - Instagram integration completion rate
  - First automation creation rate
- **Engagement:**
  - Daily active users
  - Automations created per user
  - Active automations per user
- **Retention:**
  - Monthly active users
  - Churn rate
  - Subscription upgrade rate

### 9.2 Business Metrics
- **Revenue:**
  - Monthly recurring revenue (MRR)
  - Average revenue per user (ARPU)
  - Free-to-paid conversion rate
- **Cost:**
  - Customer acquisition cost (CAC)
  - Infrastructure costs
  - API usage costs (OpenAI, Instagram)

### 9.3 Technical Metrics
- **Performance:**
  - Webhook processing time
  - API response times
  - Database query performance
- **Reliability:**
  - Uptime percentage
  - Error rate
  - Webhook delivery success rate

---

## 10. Risk Assessment

### 10.1 Technical Risks
- **API Changes:** Instagram/Meta API updates may break functionality
  - *Mitigation:* Version pinning, monitoring API changelogs
- **Token Expiration:** Access tokens may expire unexpectedly
  - *Mitigation:* Automatic token refresh, user notifications
- **Rate Limiting:** Instagram API rate limits may be exceeded
  - *Mitigation:* Rate limit monitoring, queuing system
- **Webhook Failures:** Webhook events may be missed
  - *Mitigation:* Retry logic, event logging, manual trigger option

### 10.2 Business Risks
- **Platform Dependency:** Heavy reliance on Instagram/Meta
  - *Mitigation:* Multi-platform expansion strategy
- **Compliance:** Instagram policy changes may affect automation
  - *Mitigation:* Policy monitoring, compliance reviews
- **Competition:** Other automation platforms
  - *Mitigation:* Feature differentiation, superior UX

### 10.3 Operational Risks
- **Scaling:** High user growth may strain infrastructure
  - *Mitigation:* Scalable architecture, load testing
- **Support:** High support volume
  - *Mitigation:* Self-service documentation, automated responses

---

## 11. Appendix

### 11.1 Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `INSTAGRAM_CLIENT_ID` / `META_APP_ID`: Instagram app ID
- `INSTAGRAM_CLIENT_SECRET` / `META_APP_SECRET`: Instagram app secret
- `INSTAGRAM_REDIRECT_URI` / `META_REDIRECT_URI`: OAuth redirect URI
- `META_PAGE_ACCESS_TOKEN`: Page access token for webhooks
- `WEBHOOK_VERIFY_TOKEN`: Webhook verification token
- `OPENAI_API_KEY`: OpenAI API key for SMARTAI
- `STRIPE_SECRET_KEY`: Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key
- `NGROK_URL` / `NEXT_PUBLIC_APP_URL`: Application base URL

### 11.2 API Dependencies
- **Instagram Graph API:** v24.0
- **OpenAI API:** GPT-4o model
- **Stripe API:** Latest version
- **Clerk API:** v6.4.0

### 11.3 Database Migrations
- Migration files located in `prisma/migrations/`
- Key migrations:
  - Initial schema setup
  - DM reply model addition

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12 | Auto | Initial product specification document |

---

**Document Status:** Draft  
**Last Updated:** December 2024  
**Next Review:** TBD

