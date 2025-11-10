# ARC Protocol - Agent Remote Communication

[![GitHub license](https://img.shields.io/github/license/arcprotocol/arcprotocol)](https://github.com/arcprotocol/arcprotocol/blob/main/LICENSE)
[![PyPI version](https://img.shields.io/pypi/v/arc-sdk.svg)](https://pypi.org/project/arc-sdk/1.2.1/)
[![RepoMapr](https://img.shields.io/badge/View%20on-RepoMapr-blue)](https://repomapr.com/arcprotocol/arcprotocol)

**ARC (Agent Remote Communication)** is a communication standard between agents for multi-agent systems. The protocol enables hosting multiple agent types on a single endpoint with agent-level routing via `requestAgent` and `targetAgent` fields, and provides workflow tracing capabilities.

> [!IMPORTANT]
> **Quantum-Resistant Security**: ARC Protocol implements post-quantum end-to-end encryption using hybrid TLS (X25519Kyber768), combining classical elliptic curve cryptography with NIST-standardized Module-Lattice-Based Key Encapsulation Mechanism (ML-KEM, FIPS 203). This provides protection against both current and future quantum computing attacks.

> For an overview of the ARC ecosystem and our vision, visit our [main GitHub organization page](https://github.com/arcprotocol).

## Key Features

- **Multi-Agent Architecture**: Single endpoint supports multiple agents with agent identification at protocol level
- **Agent-Centric Routing**: Identify request source and target at protocol level with `requestAgent`/`targetAgent` fields
- **Workflow Tracing**: End-to-end traceability across multi-agent processes via `traceId`, designed for integration with monitoring platforms
- **Stateless Design**: Each request is independent with no session state
- **Method-Based**: Clean RPC-style method invocation
- **HTTPS Transport**: Works over HTTPS with POST requests
- **Server-Sent Events**: Support for streaming responses via SSE
- **Python SDK**: Python implementation of the ARC Protocol [Python SDK](https://github.com/arcprotocol/python-sdk)

## Hybrid TLS Implementation

### What is Hybrid TLS?

Combines classical and post-quantum cryptography:
- **Classical**: X25519 (Curve25519 elliptic curve)
- **Post-Quantum**: Kyber-768 (NIST FIPS 203 ML-KEM)

**Result**: Secure against both current and future quantum attacks.

**Default**: `x25519_kyber768` (X25519 + Kyber-768)

**Industry Implementations**:
- **Zoom**: Uses Kyber-768 for E2EE (May 2024)
- **Chrome**: Uses X25519Kyber768 hybrid for TLS (Aug 2023)
- **Cloudflare**: Uses X25519MLKEM768 hybrid for TLS (2022)

### How It Works

> [!NOTE]
> **Requirements**: Both client and server must install `arc-sdk[pqc]` for post-quantum cryptography.

**TLS Handshake**:
- Both sides have PQC → Negotiates `x25519_kyber768` hybrid key exchange
- One side missing PQC → OpenSSL falls back to classical X25519

**Installation**:
```bash
pip install arc-sdk[pqc]
```

> [!TIP]
> Libraries load automatically - no manual configuration needed. Hybrid TLS is negotiated during the handshake.

## Documentation

- [Protocol Specification](./docs/arc-protocol-specification.md)
- [Best Practices](./docs/topics/best-practices.md)
- [Topics](./docs/topics/)
  - [ARC Ledger Integration](./docs/topics/arc-ledger-integration.md)
  - [Ecosystem Integration](./docs/topics/ecosystem-integration.md)


## ARC Ecosystem

> [!NOTE]
> While ARC Protocol can be used as a standalone communication protocol between agents, it works best as part of the ARC ecosystem.

- **[ARC Protocol](https://github.com/arcprotocol/arcprotocol)**: This repository - the communication standard between agents
- **[ARC Compass](https://github.com/arcprotocol/arccompass)**: Agent search engine that finds appropriate agents without ranking algorithms
- **[ARC Ledger](https://github.com/arcprotocol/arcledger)**: Centralized agent discovery registry

ARC Protocol works effectively with other components in the ARC ecosystem. The protocol's workflow tracing capabilities integrate with external monitoring and observability platforms, enabling tracking of multi-agent workflows. This design works with existing monitoring solutions while maintaining protocol simplicity.

## Maintainers

ARC Protocol is maintained by the ARC Protocol team and contributors from the open source community. See [MAINTAINERS.md](./MAINTAINERS.md) for details and [CODEOWNERS](./CODEOWNERS) for code ownership information.