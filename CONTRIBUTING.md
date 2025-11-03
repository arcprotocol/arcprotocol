# Contributing to ARC Protocol

Thank you for your interest in contributing to the ARC Protocol! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to the [ARC Protocol Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Development Setup

1. **Prerequisites**:
   - Node.js (LTS version)
   - npm or yarn
   - Git

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Format code**:
   ```bash
   npm run format
   ```

5. **Lint code**:
   ```bash
   npm run lint
   ```

## Schema Management

The ARC Protocol is defined by its OpenAPI schema located at `spec/arc/v1/schema/arc-schema.yaml`. When making changes to the protocol, you'll need to update this schema and regenerate the derived files:

```bash
# Generate TypeScript types from the OpenAPI schema
npm run generate:types

# Generate OpenRPC schema from the OpenAPI schema
npm run generate:openrpc

# Generate both types and OpenRPC schema
npm run generate:all
```


## Contributing Process

We follow the [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) for contributions.

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/arcprotocol.git
   cd arcprotocol
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/arcprotocol/arcprotocol.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** and commit them following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format:

   > [!TIP]
   > Use prefixes like `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, or `chore:` in your commit messages.
   
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve issue with X"
   git commit -m "docs: update API documentation"
   ```

6. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** from your branch to the main repository

## Pull Request Guidelines

> [!IMPORTANT]
> Before submitting your PR, make sure your changes are properly formatted and documented.

- **Title**: Use a clear and descriptive title that follows the Conventional Commits format
- **Description**: Include a detailed description explaining what changes you made and why
- **Link to Issue**: Reference any related issues (e.g., "Fixes #123")
- **Documentation**: Update any relevant documentation
- **Changelog**: Add an entry to the CHANGELOG.md file if applicable

Thank you for contributing to ARC Protocol!