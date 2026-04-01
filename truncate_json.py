# Truncate the JSON file at line 832
with open('messages/en.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep only the first 832 lines
with open('messages/en.json', 'w', encoding='utf-8') as f:
    f.writelines(lines[:832])

print("Truncated JSON at line 832")
