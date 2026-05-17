---
name: famulor
description: Build, deploy and operate AI phone agents for inbound and outbound calls, WhatsApp Business, live chat and voice chat with Famulor. Use when setting up voice AI assistants, configuring SIP trunks, building no-code call automation flows, integrating CRMs, designing system prompts, scheduling appointments via Cal.com/Calendly/GoHighLevel, managing campaigns and lead lists, or wiring mid-call tools to external APIs.
license: Proprietary
compatibility: Web dashboard at https://app.famulor.de. REST API + Webhooks. SIP integration with Twilio, Telnyx, Plivo, Vonage, Zadarma, DIDLogic, Sipcall, 3CX, Easybell, Fonial, Asterisk, RingCentral, Genesys Cloud, Five9, Amazon Chime, Aircall. MCP server for agent integration. WhatsApp Business Cloud API.
metadata:
  author: Famulor
  version: "2026.05"
  homepage: https://famulor.de
  docs: https://docs.famulor.de
  api_base: https://app.famulor.de/api/
  status_page: https://status.famulor.io
  support_email: support@famulor.io
---

# Famulor — AI Phone, Voice & Messaging Platform

> Famulor lets teams build production AI voice agents that take and make phone calls, hold WhatsApp conversations, and run live-chat — without writing any code. Everything from telephony, LLM, TTS, transcription, knowledge base, scheduling, CRM hand-off and analytics is built in.

## Capabilities

Famulor agents can do the following on behalf of a user:

- **Make and answer phone calls** — inbound (receptionist, first-level support, qualification) and outbound (cold outreach, follow-up, surveys, mass dialing) with real voice synthesis and transcription
- **Run WhatsApp Business conversations** — templates, freeform messages, automation, AI-driven replies
- **Hold web-chat and voice-chat** sessions on any website
- **Schedule appointments** in Cal.com, Calendly, GoHighLevel directly from a live call
- **Call external APIs mid-conversation** (mid-call tools) — CRM lookup, order status, calendar check, payment, ticketing
- **Manage leads** in a Kanban-style lead list, run campaigns with status control, blacklist phone numbers
- **Transfer calls** to humans or to other Famulor assistants
- **Send SMS** from the same phone number
- **Search a knowledge base** (RAG) during a call to answer product questions

## Skills

### Voice agent design
- Choose engine type (Speech-to-Speech, Multimodal, Pipeline, Dualplex™)
- Write and refine a system prompt (with AI prompt editor)
- Pick a TTS voice (Cartesia Sonic 3.5, ElevenLabs, OpenAI, PlayHT)
- Set transcription provider, LLM temperature, initial message, filler audio
- Build deterministic conversation flows in the Flow Builder

### Telephony provisioning
- Buy a Famulor-managed number for a supported region
- Bring your own SIP carrier (BYOC) via a self-service import wizard
- Configure call forwarding, voicemail handling, caller ID, DTMF keypad input
- Run troubleshooting on SIP integration issues

### Automation
- Build no-code flows that trigger before, during or after a call
- Pass data between steps, debug runs, version flows
- 100+ pre-built integrations including HubSpot, Salesforce, Pipedrive, ActiveCampaign, Cal.com, Google Calendar, Outlook, Notion, Slack, Microsoft Teams, Zoom, Shopify, WooCommerce, Stripe, Zapier, Make.com, n8n
- Industry templates for healthcare (Doctolib), accounting (DATEV, lexoffice), HR (Personio), logistics (DHL), hospitality (OpenTable, Lieferando)

### API & webhooks
- REST API with bearer-token auth (`Authorization: Bearer <token>`)
- Endpoints for Assistants, Leads, Campaigns, Mid-Call Tools, Knowledge Bases, Calls, SMS, WhatsApp, Phone Numbers, SIP Trunks
- Webhooks: `post-call`, `conversation-ended`, inbound webhook per assistant
- MCP server at `/en/mcp/server` for agent-side integration

### Analytics & ops
- Call history with full transcript, recording and metadata
- Custom dashboards with configurable widgets
- AI Coach for prompt review
- Test-Assistant flow and Cledon evaluator before going live
- Compliance: GDPR, automatic call-data deletion policies, voice-cloning legal docs

## Workflows

### Build a new inbound assistant
1. Create an assistant in the dashboard
2. Pick engine type (Speech-to-Speech recommended for natural conversation)
3. Write system prompt (or generate with AI Prompt Editor)
4. Select voice + language
5. Attach a knowledge base if needed
6. Add mid-call tools (CRM lookup, scheduler, etc.)
7. Assign a phone number
8. Test in the playground, then publish

### Launch an outbound campaign
1. Build the assistant as above
2. Upload leads (CSV or via API `POST /leads`)
3. Create a campaign linking the assistant + lead list
4. Configure caller-ID, dialing limits, voicemail behavior
5. Start the campaign via dashboard or `PUT /campaigns/{id}/status`
6. Monitor results in Lead List Kanban + Call History

### Integrate Famulor into your stack
1. Get an API token from the dashboard
2. Use REST API for CRUD on assistants, leads, calls
3. Subscribe to `post-call` webhook to receive structured call summaries
4. (Optional) Connect MCP server for AI-agent integration

## Integration

Famulor integrates with:

- **CRM / Sales:** HubSpot, Salesforce, Pipedrive, ActiveCampaign, Monday, Zoho CRM, Microsoft Dynamics, SAP, Airtable
- **Scheduling:** Cal.com, Calendly, GoHighLevel, Google Calendar, Outlook Calendar, Acuity
- **Messaging:** Slack, Microsoft Teams, Discord, Telegram, Signal, WhatsApp Business
- **Ticketing / Helpdesk:** Zendesk, Zoho Desk, Intercom
- **Project Mgmt:** Asana, Notion, ClickUp, Jira, Monday, Trello
- **Marketing:** Mailchimp, SendGrid, Klaviyo, ActiveCampaign
- **E-Commerce / Payments:** Shopify, WooCommerce, Stripe, Shopware, JTL-Wawi
- **DACH-spezifisch:** DATEV (Beleg, Kontenumsätze, Mahnung), lexoffice, Personio, Doctolib, Placetel, Sipgate, Easybell, Fonial, Peoplefone, NFON
- **No-Code Glue:** Zapier, Make.com, n8n
- **AI Providers:** OpenAI, Anthropic Claude, Google AI, Mistral

## Context

Famulor is a Germany-based AI telephony platform. It is GDPR-compliant, hosts data in the EU, and runs production voice agents at scale across DACH and international markets. Documentation is bilingual (German + English) and lives at https://docs.famulor.de. The platform supports both no-code workflows (visual flow builder, prompt editor, dashboard) and full programmatic control via REST API, MCP server and webhooks.

Pricing is usage-based (per-minute call + per-message); phone numbers are rented monthly. Free trial available at https://app.famulor.de.
