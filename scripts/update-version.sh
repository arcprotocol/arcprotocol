#!/bin/bash

# ARC Protocol Version Update Script
# This script updates version numbers across the entire project
# Usage: ./scripts/update-version.sh <new_version>
# Example: ./scripts/update-version.sh 1.1.0

set -e

# Check if version argument is provided
if [ -z "$1" ]; then
  echo "Error: No version specified"
  echo "Usage: $0 <new_version>"
  echo "Example: $0 1.1.0"
  exit 1
fi

NEW_VERSION="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Updating ARC Protocol to version $NEW_VERSION"
echo "Project root: $PROJECT_ROOT"

# Function to check if a file exists before attempting to modify it
check_file() {
  if [ ! -f "$1" ]; then
    echo "Warning: File not found: $1"
    return 1
  fi
  return 0
}

# Update package.json version
if check_file "$PROJECT_ROOT/package.json"; then
  echo "Updating package.json..."
  # Use node to update package.json to ensure proper JSON formatting
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_ROOT/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
fi

# Update OpenAPI schema version
if check_file "$PROJECT_ROOT/spec/arc/v1/schema/arc-schema.yaml"; then
  echo "Updating OpenAPI schema version..."
  # For YAML files, we use sed with careful pattern matching
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS version of sed requires an empty string for -i
    sed -i '' "s/^  version: \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/  version: \"$NEW_VERSION\"/" "$PROJECT_ROOT/spec/arc/v1/schema/arc-schema.yaml"
  else
    # Linux version
    sed -i "s/^  version: \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/  version: \"$NEW_VERSION\"/" "$PROJECT_ROOT/spec/arc/v1/schema/arc-schema.yaml"
  fi
fi

# Update OpenRPC schema version
if check_file "$PROJECT_ROOT/spec/arc/v1/schema/arc-openrpc.json"; then
  echo "Updating OpenRPC schema version..."
  # For JSON files, we use node to ensure proper JSON formatting
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_ROOT/spec/arc/v1/schema/arc-openrpc.json';
    const schema = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (schema.info && schema.info.version) {
      schema.info.version = '$NEW_VERSION';
      fs.writeFileSync(path, JSON.stringify(schema, null, 2) + '\n');
    } else {
      console.error('Warning: Could not find version field in OpenRPC schema');
    }
  "
fi

# Update version in README.md badges
if check_file "$PROJECT_ROOT/README.md"; then
  echo "Updating README.md badges..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS version of sed
    sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$NEW_VERSION/g" "$PROJECT_ROOT/README.md"
  else
    # Linux version
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$NEW_VERSION/g" "$PROJECT_ROOT/README.md"
  fi
fi

# Update version in CHANGELOG.md
if check_file "$PROJECT_ROOT/CHANGELOG.md"; then
  echo "Checking CHANGELOG.md for version entry..."
  if ! grep -q "\[${NEW_VERSION}\]" "$PROJECT_ROOT/CHANGELOG.md"; then
    echo "Warning: No entry for version $NEW_VERSION found in CHANGELOG.md"
    echo "Please add a new entry to CHANGELOG.md for version $NEW_VERSION"
  fi
fi

# Regenerate derived files
echo "Regenerating derived files with new version..."
cd "$PROJECT_ROOT"

# Check if npm is available
if command -v npm &> /dev/null; then
  echo "Running npm scripts to regenerate files..."
  npm run generate:all
else
  echo "Warning: npm not found, skipping file regeneration"
  echo "Please run 'npm run generate:all' manually to update derived files"
fi

echo "Version update complete!"
echo "Version updated to $NEW_VERSION across all project files"
echo ""
echo "Next steps:"
echo "1. Review changes with 'git diff'"
echo "2. Make sure CHANGELOG.md is updated with new version details"
echo "3. Commit changes with 'git commit -am \"Bump version to $NEW_VERSION\"'"
echo "4. Create a git tag with 'git tag v$NEW_VERSION'"
echo "5. Push changes with 'git push && git push --tags'"
