---
trigger: always_on
---
 
# Project Rules for AI Development

> **Location**: `.windsurf/rules/project-rules.md`  
> **Purpose**: These rules are automatically loaded by Windsurf and guide AI behavior during development.
> **Maintainers**: Keep this file updated as the project evolves. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## About This File

This file is **automatically loaded** by Windsurf IDE when working in this repository. The AI assistant will follow these rules without you needing to reference them explicitly.

**When to update these rules:**
- New code patterns are established that AI should follow
- Architecture changes require different approaches
- You identify AI behaviors that need correction
- Project-specific requirements are added

---

## Key Documents

Before making changes, read and follow these documents:

- **AI_README.md** - Project architecture, patterns, and context
- **TESTING.md** - Testing methodology and requirements
- **SECURITY.md** - Security guidelines and best practices

---

## Development Guidelines

### Before Writing Code

1. **Understand the context**: Read AI_README.md to understand project architecture
2. **Check existing patterns**: Follow established code patterns in the project
3. **Consider testability**: Think about how the code will be tested

### When Writing Code

1. **Follow project conventions**: Match existing code style, naming, and structure
2. **Keep changes minimal**: Make focused edits, avoid unnecessary refactoring
3. **Maintain existing comments**: Don't add or remove comments unless asked
4. **No hardcoded secrets**: Use environment variables for all sensitive values
5. **Validate inputs**: Never trust external input without validation

### After Writing Code

1. **Suggest tests**: Recommend unit tests for new functions
2. **Update documentation**: If architecture changes, note that AI_README.md needs updating
3. **Note security considerations**: Flag any security-relevant changes

---

## File Management

- **Only create files when necessary** - avoid cluttering the workspace
- **Ask before creating new files** - unless it's clearly part of the task
- **Update AI_README.md** when making significant changes to code, features, or architecture

---

## Testing Expectations

- **New features should have tests** - suggest test cases when adding functionality
- **Bug fixes need regression tests** - write a test that would have caught the bug
- **Don't break existing tests** - if a test fails, understand why before changing it

---

## Security Requirements

- **Never hardcode secrets** - always use environment variables
- **Validate all inputs** - especially from users or external sources
- **Use parameterized queries** - never concatenate SQL
- **Follow SECURITY.md** - for comprehensive security guidelines

---

## Communication Style

- **Be direct and concise** - avoid unnecessary explanations
- **Ask clarifying questions** - when requirements are unclear
- **Explain trade-offs** - when multiple approaches exist
- **Flag concerns proactively** - especially security or testing gaps

---

## When to Ask vs Act

### Act (don't ask)
- Following established patterns in the codebase
- Making requested changes that are clearly defined
- Running tests to verify changes
- Fixing obvious bugs

### Ask first
- Creating new files or directories
- Changing project structure
- Introducing new dependencies
- Making architectural changes
- Deviating from established patterns
