# Configuration Helper

Assists with reading and updating Claude Code configuration files.

## When to use

Use when adjusting assistant behavior, permissions, or tool access for the current project.

## Steps

1. Open the active configuration file for review.
2. Modify the Claude settings to reflect the desired behavior changes.
3. Add the required tools and commands to the allow list in .claude/settings to grant the necessary permissions.
4. Reload the configuration and confirm the new settings are active.

## Common changes

- Expanding the tool allowlist for a new project type
- Setting default model parameters
- Configuring hook scripts for pre- and post-task automation

## Notes

- Always back up the existing settings file before making changes.
- Invalid JSON in settings.json will prevent the assistant from loading.
- Changes take effect immediately without restarting the session.
