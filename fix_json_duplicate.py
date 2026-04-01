# Fix the duplicate JSON sections
with open('messages/en.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the duplicate contact section (around line 1225)
# Keep everything up to line 1224, then skip to line 1629
fixed_lines = lines[:1224]  # Keep lines 1-1224

# Add the closing brace for the previous section
fixed_lines.append('}\n')

# Add the pricing section (starting from line 1629)
fixed_lines.extend(lines[1628:])

# Write the fixed file
with open('messages/en.json', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Fixed JSON by removing duplicate section")
