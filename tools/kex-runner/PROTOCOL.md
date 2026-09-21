# Self-hosted runner protocol

1. A controlled node checks out the source from the approved repository or receives an equivalent source bundle.
2. The local runner executes the source directly. GitHub Actions is neither required nor authoritative.
3. The runner writes a machine-readable receipt containing execution result and receipt hash.
4. For distributed E5 tests, each node runs independently and signs/exchanges its own receipt through the system transport.
5. A coordinator compares receipts and applies the project's reconciliation rules. A hosted CI result cannot upgrade an E4/E5 state.
6. Missing hardware, transport, durable storage, or key infrastructure is recorded as an unmet dependency rather than simulated as success.
