---
name: markdown-formatter
description: Format and structure content as clean, well-organized Markdown. Use when asked to create documentation, format text, or generate Markdown output.
version: 1.0.0
---

# Markdown Formatter

## Overview

Transforms unstructured content into clean, well-organized Markdown with proper headings,
lists, code blocks, and formatting.

## Instructions

When formatting content to Markdown:

1. **Analyze the content** to identify structure (headings, lists, code, etc.)
2. **Apply hierarchy** using appropriate heading levels (H1 for title, H2 for sections)
3. **Format code** with proper language-specific syntax highlighting
4. **Create lists** for related items
5. **Add tables** for structured data comparisons

## Formatting Rules

### Headings
- H1 (`#`) - Document title only
- H2 (`##`) - Major sections
- H3 (`###`) - Subsections
- H4+ - Avoid unless necessary

### Code Blocks
- Inline code: Single backticks for short references
- Fenced blocks: Triple backticks with language identifier

### Lists
- Bullet lists: Related but unordered items
- Numbered lists: Sequential steps or ranked items
- Nested lists: Maximum 2 levels deep

## Guidelines

- Keep line length under 100 characters
- Use blank lines to separate sections
- Prefer ATX-style headings (`#`) over Setext
- Include language identifier in fenced code blocks
- Do not use HTML tags when Markdown suffices
