import json

# Read the original file
with open('messages/en.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse JSON to validate structure
try:
    data = json.loads(content)
    print("JSON is valid")
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")
    # Find the error location
    error_pos = e.pos
    lines = content[:error_pos].split('\n')
    print(f"Error around line {len(lines)}")
    
    # Show context around error
    start = max(0, error_pos - 100)
    end = min(len(content), error_pos + 100)
    print("Context:")
    print(repr(content[start:end]))
