# Scripts

This directory contains utility scripts for the project.

## Changelog Generation

The `generate-changelog.sh` script helps generate changelog entries for new releases. It automatically:
- Gets the current date with proper ordinal suffix (e.g., "May 30th 2025")
- Finds the previous version tag
- Extracts commit messages between the previous and current version
- Formats them into a changelog entry
- Updates the CHANGELOG.md file

### Usage

```bash
./scripts/generate-changelog.sh <version>
```

Example:
```bash
./scripts/generate-changelog.sh v0.9.25
```

### Requirements

- `conventional-changelog-cli` must be installed globally:
  ```bash
  npm install -g conventional-changelog-cli
  ```

### Output Format

The script generates changelog entries in the following format:
```markdown
## 0.9.25 (May 30th 2025)

- commit message 1
- commit message 2
```

The entry is automatically added to the top of the CHANGELOG.md file, right after the title.
