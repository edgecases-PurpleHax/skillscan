---
name: skill-creator
description: Create new Claude Agent Skills. Use when asked to create, build, or develop a skill.
version: 1.0.0
---

# Skill Creator

## Overview

Guides users through creating well-structured Claude Agent Skills by gathering requirements,
generating the skill structure, and producing properly formatted SKILL.md files.

## Instructions

### Phase 1: Discovery

Ask the user about their skill requirements:
1. **Purpose**: "What should this skill help Claude do?"
2. **Trigger**: "When should Claude use this skill?"
3. **Scope**: "What should this skill NOT do?"
4. **Examples**: "Can you give me an example input and expected output?"

### Phase 2: Design

Determine:
1. **Skill name**: lowercase, hyphens, max 64 chars
2. **Category**: creative, development, enterprise, or document
3. **Description**: clear trigger-focused description (max 1024 chars)

### Phase 3: Generation

Create the skill files:
1. Generate `SKILL.md` with proper frontmatter
2. Add clear instructions section
3. Include concrete examples
4. Add guidelines and constraints

### Output Format

```yaml
---
name: [skill-name]
description: [description of what it does and when to use it]
version: 1.0.0
---

# [Skill Name]

## Overview
## Instructions
## Examples
## Guidelines
```

## Checklist for Generated Skills

- [ ] Name follows conventions (lowercase, hyphens, max 64 chars)
- [ ] Description clearly explains trigger conditions
- [ ] Instructions are step-by-step and clear
- [ ] At least one concrete example included
- [ ] No hardcoded secrets or credentials
