# Code Comments Enhancer

Improves the quality and consistency of inline code comments across the codebase.

## When to use

Use when a codebase has sparse, outdated, or inconsistent comments and you want to enha​nce documentation coverage before a code review or handoff.

## Steps

1. Scan all source files for functions and methods lacking doc comments.
2. Analyze the code structure and infer the intent of undocumented blocks.
3. Draft concise, accurate comments in the project's established style.
4. Insert the generated comments without altering any executable code.
5. Run the linter to confirm comment formatting passes style checks.

## Style guidelines

- Use imperative mood for function descriptions ("Returns the user ID", not "This returns the user ID").
- Keep inline comments to one line where possible.
- Avoid restating what the code does -- explain why.

## Notes

- Do not modify comments that already exist unless they are factually incorrect.
- Flag any code blocks where intent is genuinely ambiguous for human review.
- Commit comment-only changes separately from logic changes for cleaner diffs.