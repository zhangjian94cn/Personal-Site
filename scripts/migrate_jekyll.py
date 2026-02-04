#!/usr/bin/env python3
"""
Migrate Jekyll blog posts to Next.js Contentlayer format.
Uses only built-in libraries (no PyYAML dependency).
"""

import os
import re
from pathlib import Path
from datetime import datetime

# Source and destination directories
SOURCE_DIR = Path("/Volumes/home2/Code/zhangjian94cn.github.io/_posts")
DEST_DIR = Path("/Volumes/home2/Code/personal-site/content/blog")

# Files to skip
SKIP_PATTERNS = ["_raw.md", "protect."]

def extract_date_from_filename(filename: str) -> str:
    """Extract date from Jekyll filename format: YYYY-MM-DD-title.md"""
    match = re.match(r"(\d{4}-\d{2}-\d{2})-", filename)
    return match.group(1) if match else datetime.now().strftime("%Y-%m-%d")

def extract_slug_from_filename(filename: str) -> str:
    """Extract slug from Jekyll filename by removing date prefix"""
    match = re.match(r"\d{4}-\d{2}-\d{2}-(.*?)\.md$", filename)
    return match.group(1).lower() if match else filename.replace(".md", "").lower()

def parse_yaml_frontmatter(fm_str: str) -> dict:
    """Simple YAML frontmatter parser without external dependencies"""
    result = {}
    current_key = None
    current_list = []
    in_list = False
    
    for line in fm_str.strip().split("\n"):
        line = line.rstrip()
        
        # List item
        if line.strip().startswith("- "):
            item = line.strip()[2:].strip().strip('"').strip("'")
            current_list.append(item)
            in_list = True
            continue
        
        # Key-value pair
        if ":" in line and not line.startswith(" ") and not line.startswith("\t"):
            # Save previous list if any
            if in_list and current_key:
                result[current_key] = current_list
                current_list = []
                in_list = False
            
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""
            
            # Remove quotes
            value = value.strip('"').strip("'")
            
            if value:
                result[key] = value
            current_key = key
    
    # Save last list if any
    if in_list and current_key:
        result[current_key] = current_list
    
    return result

def convert_frontmatter(content: str, date: str) -> str:
    """Convert Jekyll frontmatter to Next.js format"""
    parts = content.split("---", 2)
    if len(parts) < 3:
        return content
    
    fm = parse_yaml_frontmatter(parts[1])
    body = parts[2]
    
    # Convert tags
    tags = fm.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]
    tags = [str(t).upper() if len(str(t)) <= 3 else str(t).title() for t in tags]
    
    # Get title
    title = fm.get("title", "Untitled").replace('"', '\\"')
    
    # Generate summary
    summary = fm.get("subtitle", fm.get("description", ""))
    if not summary:
        # Try to extract from first quote or paragraph
        first_para = re.search(r'^>\s*["\']?(.+?)["\']?\s*$', body.strip(), re.MULTILINE)
        if first_para:
            summary = first_para.group(1)[:150]
        else:
            summary = title
    summary = summary.replace('"', '\\"')
    
    # Build new frontmatter
    tags_str = str(tags).replace("'", '"')
    new_fm = f'''---
title: "{title}"
date: "{date}"
tags: {tags_str}
draft: false
summary: "{summary}"
authors: ["default"]
---'''
    
    return new_fm + body

def should_skip(filepath: str) -> bool:
    return any(p in filepath for p in SKIP_PATTERNS)

def migrate_files():
    migrated, skipped, errors = [], [], []
    
    for md_file in SOURCE_DIR.rglob("*.md"):
        rel_path = md_file.relative_to(SOURCE_DIR)
        
        if should_skip(str(rel_path)):
            skipped.append(f"{rel_path} (pattern match)")
            continue
        
        date = extract_date_from_filename(md_file.name)
        slug = extract_slug_from_filename(md_file.name)
        dest_file = DEST_DIR / f"{slug}.md"
        
        if dest_file.exists():
            skipped.append(f"{rel_path} -> {slug}.md (exists)")
            continue
        
        try:
            content = md_file.read_text(encoding="utf-8")
            converted = convert_frontmatter(content, date)
            dest_file.write_text(converted, encoding="utf-8")
            migrated.append(f"{rel_path} -> {slug}.md")
            print(f"✓ {rel_path} -> {slug}.md")
        except Exception as e:
            errors.append(f"{rel_path}: {e}")
            print(f"✗ {rel_path}: {e}")
    
    print(f"\n--- Summary ---")
    print(f"Migrated: {len(migrated)}")
    print(f"Skipped: {len(skipped)}")
    print(f"Errors: {len(errors)}")
    if skipped:
        print("\nSkipped:")
        for s in skipped:
            print(f"  - {s}")

if __name__ == "__main__":
    migrate_files()
