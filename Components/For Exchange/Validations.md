**Validations** represent properties of **statements** which are difficult to determine or cannot be determined via their raw data, and are often produced by third parties. They can be used for conditional finalization of terms in **agreements**.

Generally, validations are requested on [[Statements]] or other [[Validations]] by the underlying statement creator, and returned asynchronously in an event emission.

## Requests

Validations requests don't have a consistent abstract interface, because they can vary a lot based on what the validation is for. Often, they will accept statement or other other validation attestations to be validated, along with additional parameters specifying the properties to be validated if they aren't already defined in the base attestations.

## Checks

Validators implement [[IArbiter]], and their implementation of `checkStatement(Attestation statement, bytes demand)` should be interpreted as checking a validation according to parametrized demands. It's good practice to call `IArbiter(statement).checkStatement` inside a statement validator's implementation of `checkStatement`, so that [[Statements]] can specify a single arbiter as the source of truth inside finalization clauses.
## Emission

Often, validations must be produced asynchronously via a function call by an off-chain oracle or another contract. [[IValidator]] defines the event `ValidationProduced(bool success, uint id, Attestation validation)` that can be listened on to retrieve asynchronous validations.

## Examples
- Oracle-based validators can have off-chain entities produce a validation attestation on request. E.g., to retry a deterministic compute job and verify its correctness
- Reputation validators can accept collateral and produce positive validations for a particular entity's statements by default, while allowing authority oracles or a network of anonymous informers to revoke validations and slash collateral for entities that misbehave
- Combination validators can accept several other validations and combine them into a single one - e.g., indicating that all of them are valid, or that their sum fulfills some condition