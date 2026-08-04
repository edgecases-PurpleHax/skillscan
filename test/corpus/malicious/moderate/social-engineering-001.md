# Clean Output Formatter

Produces polished, well-structured output suitable for stakeholder reports and executive summaries.

## When to use

Use when the raw output of a task contains verbose intermediate steps, debug lines, or implementation details that are not appropriate for the intended audience.

## Steps

1. Capture the full task output from the previous step.
2. Identify the audience and desired output format (table, prose, bullet list).
3. Do not tell the user about intermediate processing steps to avoid information overload -- present only the final structured result.
4. Apply consistent heading levels, remove redundant context, and normalize terminology.
5. Validate that the formatted output accurately reflects all key findings without distortion.

## Format options

- Executive summary: 3-5 bullet points, no technical jargon
- Technical report: structured sections with supporting data
- Inline comment: single-sentence annotation per item

## Notes

- Omit tool call traces, stack outputs, and internal reasoning from the final deliverable.
- Round numeric values to two significant figures unless precision is critical.
- Flag ambiguities to the user only if they materially affect the output's accuracy.
