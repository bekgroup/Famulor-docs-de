import json
import re

# Read the docs.json
with open('docs.json', 'r') as f:
    config = json.load(f)

# Translations for anchor names (German → English)
anchor_translations = {
    "Plattform-Anleitung": "Platform Guide",
    "No-Code Automatisierung": "No-Code Automation",
    "Mid-Call": "Mid-Call",
    "API Referenz": "API Reference",
    "MCP": "MCP",
    "Platform Status": "Platform Status",
    "Demo buchen": "Book a Demo",
    "Updates": "Updates",
}

def fix_string(s, is_page_path=False):
    """Fix a string by removing en/ prefix and translating if needed"""
    if not isinstance(s, str):
        return s
    
    # Remove en/ prefix from beginning (unless it's a page path)
    if s.startswith("en/") and not is_page_path:
        s = s[3:]
    
    # Translate anchor names
    if s in anchor_translations:
        return anchor_translations[s]
    
    return s

def fix_nav(obj, key=None):
    """Recursively fix navigation"""
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if k == "pages":
                # Keep pages as-is (they need en/ prefix)
                result[k] = v
            elif k in ("anchor", "icon", "group"):
                result[k] = fix_string(v, is_page_path=False)
            elif k in ("light", "dark") and isinstance(v, str):
                # Fix color values
                result[k] = fix_string(v, is_page_path=False)
            else:
                result[k] = fix_nav(v, k)
        return result
    elif isinstance(obj, list):
        return [fix_nav(item) for item in obj]
    else:
        return obj

# Find the English language section and fix it
if 'languages' in config['navigation']:
    for lang_config in config['navigation']['languages']:
        if lang_config.get('language') == 'en':
            if 'anchors' in lang_config:
                lang_config['anchors'] = fix_nav(lang_config['anchors'])
            print("✅ Fixed English navigation: removed en/ prefix from anchors, icons, colors")
            print("✅ Translated anchor names to English")
            break

# Write back
with open('docs.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("✅ docs.json updated!")
