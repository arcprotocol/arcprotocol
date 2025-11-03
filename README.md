# ARC Protocol - Agent Remote Communication

[![GitHub license](https://img.shields.io/github/license/arcprotocol/arcprotocol)](https://github.com/arcprotocol/arcprotocol/blob/main/LICENSE)
[![PyPI version](https://img.shields.io/pypi/v/arc-sdk.svg)](https://pypi.org/project/arc-sdk/1.2.1/)
[![RepoMapr](https://img.shields.io/badge/View%20on-RepoMapr-blue)](https://repomapr.com/arcprotocol/arcprotocol)

**ARC (Agent Remote Communication)** is a communication standard between agents for multi-agent systems. The protocol enables hosting multiple agent types on a single endpoint with agent-level routing via `requestAgent` and `targetAgent` fields, and provides workflow tracing capabilities.

> For an overview of the ARC ecosystem and our vision, visit our [main GitHub organization page](https://github.com/arcprotocol).

## Key Features

- **Multi-Agent Architecture**: Single endpoint supports multiple agents with agent identification at protocol level
- **Agent-Centric Routing**: Identify request source and target at protocol level with `requestAgent`/`targetAgent` fields
- **Workflow Tracing**: End-to-end traceability across multi-agent processes via `traceId`, designed for integration with monitoring platforms
- **Stateless Design**: Each request is independent with no session state
- **Method-Based**: Clean RPC-style method invocation
- **HTTPS Transport**: Works over HTTPS with POST requests
- **Server-Sent Events**: Support for streaming responses via SSE

## Documentation

- [Protocol Specification](./docs/arc-protocol-specification.md)
- [Best Practices](./docs/topics/best-practices.md)
- [Topics](./docs/topics/)
  - [ARC Ledger Integration](./docs/topics/arc-ledger-integration.md)
  - [Ecosystem Integration](./docs/topics/ecosystem-integration.md)


## ARC Ecosystem

While ARC Protocol can be used as a standalone communication protocol between agents, it works best as part of the ARC ecosystem:

- **[ARC Protocol](https://github.com/arcprotocol/arcprotocol)**: This repository - the communication standard between agents
- **[Python SDK](https://github.com/arcprotocol/python-sdk)**: Python implementation of the ARC Protocol
- **[ARC Compass](https://github.com/arcprotocol/arccompass)**: Agent search engine that finds appropriate agents without ranking algorithms
- **[ARC Ledger](https://github.com/arcprotocol/arcledger)**: Centralized agent discovery registry

ARC Protocol works effectively with other components in the ARC ecosystem. The protocol's workflow tracing capabilities integrate with external monitoring and observability platforms, enabling tracking of multi-agent workflows. This design works with existing monitoring solutions while maintaining protocol simplicity.

For more information about how the ARC ecosystem components work together, visit our [main GitHub organization page](https://github.com/arcprotocol).

## Maintainers

ARC Protocol is maintained by the ARC Protocol team and contributors from the open source community. See [MAINTAINERS.md](./MAINTAINERS.md) for details and [CODEOWNERS](./CODEOWNERS) for code ownership information.