# Contributing to ARC Protocol

Thank you for your interest in contributing to the ARC Protocol! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Guidelines](#development-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to the [ARC Protocol Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/arcprotocol.git
   cd arcprotocol
   ```
3. Add the original repository as an upstream remote:
   ```bash
   git remote add upstream https://github.com/arcprotocol/arcprotocol.git
   ```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests to verify your setup:
   ```bash
   npm test
   ```

## Contributing Process

1. **Find an Issue**: Look for open issues or create a new one to discuss your proposed change.

2. **Create a Branch**: Create a feature branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**: Implement your changes, following our [Development Guidelines](#development-guidelines).

4. **Write Tests**: Add tests for your changes to ensure they work as expected.

5. **Update Documentation**: Update relevant documentation to reflect your changes.

6. **Commit Changes**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   ```bash
   git commit -m "feat: add new feature" # for features
   git commit -m "fix: resolve issue with X" # for bug fixes
   git commit -m "docs: update API documentation" # for documentation
   ```

7. **Pull Request**: Submit a pull request from your feature branch to our `main` branch.

## Pull Request Guidelines

- **Title**: Use a clear and descriptive title that summarizes your changes.
- **Description**: Include a detailed description explaining what changes you made and why.
- **Link to Issue**: Reference any related issues (e.g., "Fixes #123").
- **Tests**: Ensure all tests pass and add new tests for your changes.
- **Documentation**: Update any relevant documentation.
- **Changelog**: Add an entry to the CHANGELOG.md file if applicable.
- **Squash Commits**: Squash related commits before submitting your PR.

## Development Guidelines

### Coding Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write self-documenting code with meaningful variable names
- Add comments for complex logic

### API Design Principles

1. **Simplicity**: Keep APIs simple and intuitive
2. **Consistency**: Maintain consistent patterns throughout the codebase
3. **Documentation**: Document all public APIs thoroughly
4. **Backwards Compatibility**: Avoid breaking changes when possible

### Testing Guidelines

- Write unit tests for all new code
- Maintain high test coverage
- Include integration tests for complex features
- Test edge cases and error scenarios

## Protocol Compliance

The ARC Protocol is a specification-driven project. When contributing, ensure that your changes:

1. Adhere to the [ARC Protocol Specification](./specification/README.md)
2. Maintain compatibility with existing implementations
3. Follow the protocol's design principles
4. Include appropriate type definitions
5. Document any extensions or customizations

## Release Process

1. **Versioning**: We follow [Semantic Versioning](https://semver.org/)
2. **Release Candidates**: Major releases have RC versions for testing
3. **Changelog**: Update CHANGELOG.md with all notable changes
4. **NPM Publishing**: Releases are published to npm automatically via GitHub Actions

## Questions?

If you have any questions or need help, please:
- Open an issue with your question
- Join our Discord community (link in README)
- Contact us via email at info@arcprotocol.org

Thank you for contributing to ARC Protocol!