---
name: ensemble-solving
description: Generate multiple diverse solutions in parallel and select the best. Use for architecture decisions, code generation with multiple valid approaches, or creative tasks where exploring alternatives improves quality.
---

# Ensemble Problem Solving

Generate multiple solutions in parallel by spawning 3 subagents with different approaches,
then evaluate and select the best result.

## When to Use

**Activation phrases:**
- "Give me options for..."
- "What's the best way to..."
- "Explore different approaches..."
- "Compare approaches for..."
- "Which approach should I use..."

**Good candidates:**
- Architecture decisions with trade-offs
- Code generation with multiple valid implementations
- API design with different philosophies
- Naming, branding, documentation style
- Refactoring strategies
- Algorithm selection

**Skip ensemble for:**
- Simple lookups or syntax questions
- Single-cause bug fixes
- File operations, git commands
- Deterministic configuration changes

## What It Does

1. Analyzes the task to determine if ensemble approach is valuable
2. Generates 3 distinct prompts using appropriate diversification strategy
3. Spawns 3 parallel subagents to develop solutions independently
4. Evaluates all solutions using weighted criteria
5. Returns the best solution with explanation and alternatives summary

## Diversification Strategies

**For Code (Constraint Variation):**
| Approach | Focus |
|----------|-------|
| Simplicity | Minimal code, maximum readability |
| Performance | Efficient, optimized |
| Extensibility | Clean abstractions, easy to extend |

**For Architecture (Approach Variation):**
| Approach | Focus |
|----------|-------|
| Top-down | Requirements to Interfaces to Implementation |
| Bottom-up | Primitives to Composition to Structure |
| Lateral | Analogies from other domains |

## Evaluation Rubric

| Criterion | Base Weight | Description |
|-----------|-------------|-------------|
| Correctness | 30% | Solves the problem correctly |
| Completeness | 20% | Addresses all requirements |
| Quality | 20% | How well-crafted |
| Clarity | 15% | How understandable |
| Elegance | 15% | How simple/beautiful |

## Token Cost

~4x overhead vs single attempt. Worth it for high-stakes architecture decisions,
creative work where first attempt is rarely optimal, and learning scenarios.
