# ARC Protocol Schemas

This directory contains the schema definitions for the ARC Protocol in different formats.

## Contents

- [arc-schema.yaml](./arc-schema.yaml) - OpenAPI 3.0 schema for the ARC Protocol
- [arc-openrpc.json](./arc-openrpc.json) - OpenRPC 1.2.6 schema for the ARC Protocol

## OpenAPI Schema

The OpenAPI schema (arc-schema.yaml) provides a REST-style definition of the ARC Protocol endpoints. This is useful for:

- Generating client libraries
- Documentation generation
- API testing tools
- REST-oriented implementations

## OpenRPC Schema

The OpenRPC schema (arc-openrpc.json) provides a JSON-RPC oriented definition of the ARC Protocol methods. This is useful for:

- JSON-RPC client/server code generation
- Method documentation
- RPC-oriented implementations
- Method introspection

OpenRPC is specifically designed for JSON-RPC APIs, making it a natural fit for the ARC Protocol's RPC-based design.

## Using the Schemas

### OpenAPI

```bash
# Generate client code using OpenAPI Generator
openapi-generator-cli generate -i arc-schema.yaml -g typescript-axios -o ./generated-client

# Generate documentation
redoc-cli bundle -o arc-api-docs.html arc-schema.yaml
```

### OpenRPC

```bash
# Generate client code using OpenRPC Generator
openrpc-generator client -i arc-openrpc.json -o ./generated-client -l typescript

# Generate documentation
openrpc-generator docs -i arc-openrpc.json -o ./docs
```

## Schema Versioning

Both schemas follow the ARC Protocol version. The current version is:

- **v1.0.0** - Initial stable release