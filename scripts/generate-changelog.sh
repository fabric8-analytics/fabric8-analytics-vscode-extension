#!/bin/bash

# Check if version argument is provided
if [ -z "$1" ]; then
    echo "Error: Version argument is required"
    echo "Usage: ./scripts/generate-changelog.sh <version>"
    exit 1
fi

# Get the current date with ordinal suffix
day_suffix=$(date +"%e" | sed 's/^[[:space:]]*//')   
if [ "$day_suffix" = "1" ] || [ "$day_suffix" = "21" ] || [ "$day_suffix" = "31" ]; then
  suffix="st"
elif [ "$day_suffix" = "2" ] || [ "$day_suffix" = "22" ]; then
  suffix="nd"
elif [ "$day_suffix" = "3" ] || [ "$day_suffix" = "23" ]; then
  suffix="rd"
else
  suffix="th"
fi
today="$(date +"%b %-d")$suffix $(date +"%Y")"

# Check if conventional-changelog is installed
if ! command -v conventional-changelog &> /dev/null; then
    echo "Error: conventional-changelog is not installed"
    echo "Please install it using: npm install -g conventional-changelog-cli"
    exit 1
fi

# Get the previous version from package.json
prev_version=$(node -p "require('./package.json').version")
echo "Previous version: $prev_version"

# Create a temporary file for the new changelog
temp_file=$(mktemp)

# Generate new changelog entries for the specific version
version="$1"
version=${version#v}
echo "Generating changelog for version $version..."

# Get the previous version tag
prev_tag=$(git tag --sort=-v:refname | grep -A 1 "v$version" | tail -n 1)
if [ -z "$prev_tag" ]; then
    echo "Error: Could not find previous tag for version $version"
    exit 1
fi
echo "Previous tag: $prev_tag"

# Get commit messages between tags
commit_messages=$(git log --pretty=format:"- %s" $prev_tag..v$version)

# Create the new version header and content
version_header="## $version ($today)

$commit_messages
"

# Debug: Show the final header
echo "Final version header:"
echo "$version_header"

# Add the new version at the top of the existing changelog
if [ -f CHANGELOG.md ]; then
    # If the file exists, add the new version after the title
    # Create a temporary file for the new content
    temp_changelog=$(mktemp)
    # Add the title
    head -n 1 CHANGELOG.md > "$temp_changelog"
    # Add the new version header
    echo "$version_header" >> "$temp_changelog"
    # Add the rest of the existing changelog
    tail -n +2 CHANGELOG.md >> "$temp_changelog"
    # Replace the original file
    mv "$temp_changelog" CHANGELOG.md
else
    # If the file doesn't exist, create it with the title and new version
    echo "# Change Log

$version_header" > CHANGELOG.md
fi

# Clean up
rm "$temp_file"

# Extract release notes for GitHub release
notes=$(sed -n "/## $version/,/^##/p" ./CHANGELOG.md | grep -v '##')

# If running in GitHub Actions, output the notes
if [ -n "$GITHUB_OUTPUT" ]; then
    # Escape special characters for GitHub Actions
    notes="${notes//'/'%27}"
    notes="${notes//$'\n'/'%0A'}"
    notes="${notes//$'\r'/'%0D'}"
    delimiter="$(openssl rand -hex 8)"
    echo "notes<<${delimiter}" >> "$GITHUB_OUTPUT"
    echo "$notes" >> "$GITHUB_OUTPUT"
    echo "${delimiter}" >> "$GITHUB_OUTPUT"
else
    # If running locally, just print the notes
    echo "Generated changelog for version $version"
    echo "Release notes:"
    echo "$notes"
fi 