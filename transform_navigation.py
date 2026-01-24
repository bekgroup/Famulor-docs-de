import json
import copy

# Read the current docs.json
with open('docs.json', 'r') as f:
    config = json.load(f)

# Get the current anchors (German navigation)
de_anchors = config['navigation'].get('anchors', [])

# Create English anchors by prefixing all page paths with "en/"
def prefix_pages(obj, prefix="en/"):
    """Recursively prefix all page paths with the given prefix"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key == 'pages':
                result[key] = prefix_pages(value, prefix)
            elif key == 'href' and not value.startswith('http'):
                result[key] = prefix + value
            else:
                result[key] = prefix_pages(value, prefix)
        return result
    elif isinstance(obj, list):
        return [prefix_pages(item, prefix) for item in obj]
    elif isinstance(obj, str):
        # This is a page path
        if not obj.startswith('http'):
            return prefix + obj
        return obj
    else:
        return obj

en_anchors = prefix_pages(de_anchors)

# Create the new navigation structure with languages
new_navigation = {
    "global": {
        "languages": [
            {
                "language": "de",
                "default": True,
                "href": "https://docs.famulor.de"
            },
            {
                "language": "en", 
                "href": "https://docs.famulor.de/en"
            }
        ]
    },
    "languages": [
        {
            "language": "de",
            "anchors": de_anchors
        },
        {
            "language": "en",
            "anchors": en_anchors
        }
    ]
}

# Update the config
config['navigation'] = new_navigation

# Write back
with open('docs.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("✅ docs.json updated with language-specific navigation!")
print(f"   - German: {len(de_anchors)} anchors")
print(f"   - English: {len(en_anchors)} anchors (with en/ prefix)")
