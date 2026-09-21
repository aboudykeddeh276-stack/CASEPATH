# Report 03 — Layer-2 Engineering, Execution and Falsification

Date: 2026-09-21
Repository: aboudykeddeh276-stack/CASEPATH

## 1. Executive result

The missing Layer-2 control logic has now been implemented as executable code rather than represented as architecture prose.

Implemented:
- ToT safety kernel;
- coordinate directory;
- Layer-2 reconciler;
- fault-injection matrix;
- executable falsification suite;
- machine-generated evidence receipt;
- CI execution path;
- explicit evidence boundary.

Not implemented by this change:
- multi-machine transport;
- durable distributed storage;
- authenticated membership;
- quorum/consensus;
- partition/recovery protocol;
- Byzantine fault tolerance.

Those omissions are recorded as omissions because the present execution evidence does not support the stronger claims.

## 2. Actual execution path

event
→ ToT safety kernel
→ coordinate directory
→ Layer-2 reconciler
→ state/evidence

The safety kernel rejects malformed or unsafe events before reconciliation.

The directory independently validates non-zero coordinates and refuses divergent occupancy.

The reconciler applies causally newer admissible state, ignores duplicate/older state, and exposes same-order divergence as CONFLICT when independently admitted states are merged.

## 3. ToT safety kernel

The kernel checks:
- required event fields;
- non-zero coordinate syntax;
- positive safe-integer epoch and sequence;
- predecessor continuity;
- monotonic sequence;
- payload hash integrity;
- replay/reorder;
- stale epoch;
- unknown predecessor.

Accepted events generate a structured receipt containing event identity, node, coordinate, order and payload hash.

## 4. Coordinate directory

The directory is not embedded in the application projection.

It maintains coordinate records containing node identity, epoch, sequence and payload hash.

A divergent registration for an occupied coordinate is rejected. This prevents a local directory from silently converting two incompatible owners into one record.

The current implementation is a deterministic directory component. It is not yet a multi-node replicated directory.

## 5. Layer-2 reconciler

The reconciler separates three outcomes:

APPLIED: incoming admissible state is causally newer.

IGNORED: incoming state is duplicate or older.

CONFLICT: independently admitted states occupy the same ordering position while carrying divergent content.

The conflict path is deliberately tested using two independent local replicas before their states are presented to a third reconciler. This demonstrates the conflict semantics without falsely calling one process a distributed network.

## 6. Fault injection

The executable suite injects:
1. duplicate;
2. replay;
3. stale epoch;
4. chain break;
5. zero coordinate;
6. coordinate collision;
7. payload tampering;
8. unknown predecessor;
9. same-order divergence.

The CI workflow executes syntax validation and then runs the falsification process. The process exits non-zero if any assertion fails.

## 7. What advanced

The following statements moved from architectural intent to executable evidence:

- state admission is executable;
- coordinate validation is executable;
- coordinate collision handling is executable;
- predecessor continuity is executable;
- payload integrity is executable;
- replay/stale ordering rejection is executable;
- reconciliation is separated from admission;
- divergent same-order state is preserved as conflict;
- fault classes are machine-readable;
- the execution result can be committed as a hash-addressed receipt.

## 8. What remains unproven

### 8.1 Multi-node distributed execution

Status: UNPROVEN.

Why: the implementation runs in one process. No independent network participants were observed executing the same protocol.

Why the why remains unaddressed: transport and distributed persistence were intentionally not conflated with the state-machine semantics in this layer. The present evidence establishes the deterministic local contract first.

Required architecture:
- three or more independent node processes;
- independent durable state;
- network transport;
- node identity independent of process identity;
- message duplication/reordering;
- partition injection;
- recovery;
- cross-node receipt exchange.

### 8.2 Durable continuity

Status: UNPROVEN.

Why: current state is in memory.

Why the why remains unaddressed: durable recovery requires a separate persistence contract. Without it, restart behaviour cannot be claimed.

Required architecture:
- append-only durable event journal;
- atomic checkpoint;
- recovery scanner;
- receipt-chain restoration;
- crash injection between state transitions;
- restart/replay verification.

### 8.3 Distributed coordinate ownership

Status: UNPROVEN DISTRIBUTEDLY; LOCALLY IMPLEMENTED.

Why: collision detection exists in one directory instance, but independent nodes cannot currently challenge each other's ownership.

Why the why remains unaddressed: global uniqueness is a distributed property.

Required architecture:
- globally unique node identity;
- allocation/ownership protocol;
- replicated directory;
- conflict evidence;
- reassignment/recovery semantics.

### 8.4 Network partition and convergence

Status: UNPROVEN.

Why: there is no networked replica set in this layer.

Why the why remains unaddressed: partition behaviour cannot be inferred from a single-process test.

Required architecture:
- independent replicas;
- explicit network transport;
- partition controller;
- delayed/duplicated/reordered delivery;
- reconnect;
- deterministic merge;
- convergence evidence.

### 8.5 Byzantine resistance

Status: UNPROVEN.

Why: hash integrity detects changed content but does not establish sender authority or agreement between mutually distrustful participants.

Why the why remains unaddressed: cryptographic integrity and distributed agreement solve different problems.

Required architecture:
- authenticated node identities;
- key lifecycle;
- membership;
- quorum rules;
- equivocation detection;
- signed evidence exchange;
- partition/rejoin handling.

### 8.6 Permanent mesh availability

Status: UNPROVEN.

Why: no evidence currently demonstrates that sufficient independent nodes can preserve service semantics after node loss.

Why the why remains unaddressed: node-loss tolerance requires actual replication, recovery and service-routing mechanisms.

Required architecture:
- replicated state;
- membership/failure detection;
- routing;
- recovery;
- quorum/availability policy;
- long-running multi-node test.

## 9. Why these deficiencies cannot be silently promoted

A local deterministic state machine is not automatically a distributed system.

A hash chain is not automatically consensus.

A coordinate table is not automatically distributed ownership.

A browser runtime is not automatically a persistent service.

A conflict detector is not automatically convergence.

A collection of nodes is not automatically Byzantine fault tolerant.

The engineering layer therefore records these boundaries as first-class evidence states.

## 10. Standards comparison

WebTransport is a relevant transport candidate. W3C's publication history records a Candidate Recommendation Snapshot dated 30 July 2026. It provides a web transport mechanism, not the project-specific state admission, coordinate ownership or reconciliation rules.

Verifiable Credentials Data Model 2.0 is a W3C Recommendation dated 15 May 2025. It defines a machine-verifiable claims model and security mechanisms for credentials. It is relevant to identity/evidence exchange, but it does not define the Layer-2 state reconciliation protocol implemented here.

These standards therefore occupy different architectural positions:
- transport standards move state;
- credential/integrity standards represent or authenticate claims;
- reconciliation defines state interaction;
- membership/consensus defines distributed agreement.

No standard reviewed here supplies all four functions as one mechanism.

## 11. Evidence boundary

Repository presence proves source/carrier custody.

Syntax validation proves the program parses.

The falsification process proves the implemented assertions execute and pass.

None of those facts independently proves:
- multi-machine execution;
- public serving of the new runtime;
- durable distributed state;
- global coordinate uniqueness;
- Byzantine tolerance;
- permanent availability.

Those claims remain unproven until their missing architectures execute under the corresponding fault conditions.

## 12. Current state after Report 03

LOCAL LAYER-2 ADMISSION: IMPLEMENTED
COORDINATE DIRECTORY CONTRACT: IMPLEMENTED
LOCAL RECONCILIATION: IMPLEMENTED
FAULT INJECTION: IMPLEMENTED
EVIDENCE RECEIPT: IMPLEMENTED
CI EXECUTION: IMPLEMENTED
MULTI-NODE TRANSPORT: ABSENT
DURABLE DISTRIBUTED DIRECTORY: ABSENT
PARTITION/RECOVERY: ABSENT
AUTHENTICATED MEMBERSHIP: ABSENT
QUORUM/CONSENSUS: ABSENT
BYZANTINE AGREEMENT: ABSENT
MESH-WIDE PERMANENCE: NOT PROVEN

## 13. Required engineering transition

The next layer is not another document describing distribution.

It must instantiate independent nodes and make them exchange actual state.

Minimum executable topology:

N1 ↔ N2 ↔ N3

with:
- independent state;
- explicit transport;
- coordinate registration;
- event exchange;
- duplicate/reorder injection;
- partition;
- crash/restart;
- recovery;
- divergent-state injection;
- cross-node receipt comparison.

Only those executions can advance the remaining evidence classes.

## 14. Receipt contract

The executable engine produces a JSON receipt containing:
- schema;
- every test result;
- pass count;
- total count;
- all-pass state;
- fault classes;
- final directory snapshot;
- final reconciled state;
- receipt hash.

The receipt is generated from the observed execution result, not from a manually asserted success flag.
