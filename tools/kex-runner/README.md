# KEX Self-Hosted Execution Runner

This is the authoritative execution path for the Layer-2 local verification suite.

GitHub is a source distribution, version-lineage, and public-code surface. It is not the execution authority and is not required for the tests to run.

Run from a repository checkout:

    tools/kex-runner/kex-self-runner.sh

The runner writes syntax.txt, layer2-receipt.json, runner-receipt.json, and status.txt under evidence/self-runner.

The runner fails closed if syntax validation fails, the Layer-2 executable fails, or any falsification assertion fails.

The runner contains no GitHub API calls, GitHub Actions dependency, hosted CI dependency, or external service dependency.

For an actual multi-node run, invoke this runner independently on each controlled node and exchange only the resulting receipts over the project's transport layer. Repository publication is not execution evidence.
