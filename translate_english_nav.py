import json

# Translation mapping for navigation labels
translations = {
    # Anchors
    "Plattform-Anleitung": "Platform Guide",
    "No-Code Automatisierung": "No-Code Automation",
    "Mid-Call": "Mid-Call",
    "API Referenz": "API Reference",
    "MCP": "MCP",
    "Platform Status": "Platform Status",
    "Demo buchen": "Book a Demo",
    "Updates": "Updates",
    
    # Groups
    "Einführung": "Introduction",
    "Für Entwickler": "For Developers",
    "Erste Schritte": "Getting Started",
    "KI-Assistenten Übersicht": "AI Assistants Overview",
    "Beispiel-Prompts": "Example Prompts",
    "Custom Dashboards": "Custom Dashboards",
    "Telefonnummern": "Phone Numbers",
    "Eingehende Anrufe": "Inbound Calls",
    "Ausgehende Anrufe": "Outbound Calls",
    "KI-Prompting & Konversationsdesign": "AI Prompting & Conversation Design",
    "Automatisierung & Integrationen": "Automation & Integrations",
    "Kosten & Preise": "Costs & Pricing",
    "SIP Telefonnummern": "SIP Phone Numbers",
    "Nummern-Bereitstellung": "Number Provisioning",
    "Fehlerbehebung & FAQs": "Troubleshooting & FAQs",
    "Whitepapers & Ressourcen": "Whitepapers & Resources",
    "Vertrieb & Best Practices": "Sales & Best Practices",
    "Rechtliche Informationen": "Legal Information",
    "No-Code Automatisierungsplattform": "No-Code Automation Platform",
    "Anruf-bezogen": "Call-Related",
    "Tutorials": "Tutorials",
    "Integrationen": "Integrations",
    "Beliebte Einzelintegrationen": "Popular Integrations",
    "CRM & Sales Integrationen": "CRM & Sales Integrations",
    "Integration Database": "Integration Database",
    "Mid-Call-Tools": "Mid-Call Tools",
    "Mid-Call-Tools Integrationen": "Mid-Call Tool Integrations",
    "Gesundheitswesen": "Healthcare",
    "CRM & Vertrieb": "CRM & Sales",
    "Kommunikation": "Communication",
    "Marketing": "Marketing",
    "Projektmanagement": "Project Management",
    "Zahlungen": "Payments",
    "Buchhaltung & HR": "Accounting & HR",
    "Support": "Support",
    "Logistik & Dokumente": "Logistics & Documents",
    "Gastronomie & Food": "Gastronomy & Food",
    "ERP & E-Commerce": "ERP & E-Commerce",
    "Allgemein": "General",
    "KI-Assistants": "AI Assistants",
    "Leads": "Leads",
    "Campaigns": "Campaigns",
    "Mid Call Tools": "Mid Call Tools",
    "AI Chatbot": "AI Chatbot",
    "AI Replies": "AI Replies",
    "Knowledgebases": "Knowledge Bases",
    "SMS": "SMS",
    "Phone Numbers": "Phone Numbers",
    "Calls": "Calls",
    "Webhooks": "Webhooks",
}

def translate_nav(obj):
    """Recursively translate navigation labels"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key in ("anchor", "group") and isinstance(value, str):
                result[key] = translations.get(value, value)
            else:
                result[key] = translate_nav(value)
        return result
    elif isinstance(obj, list):
        return [translate_nav(item) for item in obj]
    else:
        return obj

# Read the docs.json
with open('docs.json', 'r') as f:
    config = json.load(f)

# Find the English language section and translate it
if 'languages' in config['navigation']:
    for lang_config in config['navigation']['languages']:
        if lang_config.get('language') == 'en':
            if 'anchors' in lang_config:
                lang_config['anchors'] = translate_nav(lang_config['anchors'])
            print("✅ Translated English navigation labels")
            break

# Write back
with open('docs.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("✅ docs.json updated with English navigation labels!")
