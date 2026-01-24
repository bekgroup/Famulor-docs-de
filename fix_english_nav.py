import json

# Translation mapping for navigation labels (German → English)
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
    
    # Groups - with en/ prefix to fix
    "en/Einführung": "Introduction",
    "en/Für Entwickler": "For Developers",
    "en/Erste Schritte": "Getting Started",
    "en/KI-Assistenten Übersicht": "AI Assistants Overview",
    "en/Beispiel-Prompts": "Example Prompts",
    "en/Custom Dashboards": "Custom Dashboards",
    "en/Telefonnummern": "Phone Numbers",
    "en/Eingehende Anrufe": "Inbound Calls",
    "en/Ausgehende Anrufe": "Outbound Calls",
    "en/KI-Prompting & Konversationsdesign": "AI Prompting & Conversation Design",
    "en/Automatisierung & Integrationen": "Automation & Integrations",
    "en/Kosten & Preise": "Costs & Pricing",
    "en/SIP Telefonnummern": "SIP Phone Numbers",
    "en/Nummern-Bereitstellung": "Number Provisioning",
    "en/Fehlerbehebung & FAQs": "Troubleshooting & FAQs",
    "en/Whitepapers & Ressourcen": "Whitepapers & Resources",
    "en/Vertrieb & Best Practices": "Sales & Best Practices",
    "en/Rechtliche Informationen": "Legal Information",
    "en/No-Code Automatisierungsplattform": "No-Code Automation Platform",
    "en/Anruf-bezogen": "Call-Related",
    "en/Tutorials": "Tutorials",
    "en/Integrationen": "Integrations",
    "en/Beliebte Einzelintegrationen": "Popular Integrations",
    "en/CRM & Sales Integrationen": "CRM & Sales Integrations",
    "en/Integration Database": "Integration Database",
    "en/Mid-Call-Tools": "Mid-Call Tools",
    "en/Mid-Call-Tools Integrationen": "Mid-Call Tool Integrations",
    "en/Gesundheitswesen": "Healthcare",
    "en/CRM & Vertrieb": "CRM & Sales",
    "en/Kommunikation": "Communication",
    "en/Marketing": "Marketing",
    "en/Projektmanagement": "Project Management",
    "en/Zahlungen": "Payments",
    "en/Buchhaltung & HR": "Accounting & HR",
    "en/Support": "Support",
    "en/Logistik & Dokumente": "Logistics & Documents",
    "en/Gastronomie & Food": "Gastronomy & Food",
    "en/ERP & E-Commerce": "ERP & E-Commerce",
    "en/Allgemein": "General",
    "en/API Referenz": "API Reference",
    "en/KI-Assistants": "AI Assistants",
    "en/Leads": "Leads",
    "en/Campaigns": "Campaigns",
    "en/Mid Call Tools": "Mid Call Tools",
    "en/AI Chatbot": "AI Chatbot",
    "en/AI Replies": "AI Replies",
    "en/Knowledgebases": "Knowledge Bases",
    "en/SMS": "SMS",
    "en/Phone Numbers": "Phone Numbers",
    "en/Calls": "Calls",
    "en/Webhooks": "Webhooks",
    "en/MCP": "MCP",
    "en/Updates": "Updates",
}

# Also fix icon prefix issue
icon_fixes = {
    "en/code": "code",
    "en/chart-line": "chart-line",
    "en/graduation-cap": "graduation-cap",
    "en/scale-balanced": "scale-balanced",
    "en/plug": "plug",
    "en/megaphone": "megaphone",
}

def fix_nav(obj):
    """Recursively fix navigation labels and icons"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key in ("anchor", "group") and isinstance(value, str):
                result[key] = translations.get(value, value)
            elif key == "icon" and isinstance(value, str):
                result[key] = icon_fixes.get(value, value)
            else:
                result[key] = fix_nav(value)
        return result
    elif isinstance(obj, list):
        return [fix_nav(item) for item in obj]
    else:
        return obj

# Read the docs.json
with open('docs.json', 'r') as f:
    config = json.load(f)

# Find the English language section and fix it
if 'languages' in config['navigation']:
    for lang_config in config['navigation']['languages']:
        if lang_config.get('language') == 'en':
            if 'anchors' in lang_config:
                lang_config['anchors'] = fix_nav(lang_config['anchors'])
            print("✅ Fixed English navigation labels (removed en/ prefix and translated)")
            break

# Write back
with open('docs.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("✅ docs.json updated!")
