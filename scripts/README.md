
## Version Update Script

The `update-version.sh` script updates the version number across all relevant files in the project.

### Usage

```bash
# Using npm script
npm run version:update <new_version>

# Or directly
./scripts/update-version.sh <new_version>
```

### What It Does

The script updates version numbers in:

1. `package.json` - Main project version
2. `spec/arc/v1/schema/arc-schema.yaml` - OpenAPI schema version
3. `spec/arc/v1/schema/arc-openrpc.json` - OpenRPC schema version
4. `README.md` - Version badges
5. Checks for entry in `CHANGELOG.md` (warns if missing)

After updating versions, it automatically regenerates derived files by running:
- `npm run generate:all` (which runs both `generate:types` and `generate:openrpc`)

### After Running

1. Review changes with `git diff`
2. Make sure `CHANGELOG.md` is updated with new version details
3. Commit changes with `git commit -am "Bump version to X.Y.Z"`
4. Create a git tag with `git tag vX.Y.Z`
5. Push changes with `git push && git push --tags`
