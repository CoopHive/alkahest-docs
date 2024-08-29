**Validations** represent properties of **statements** which are difficult to determine or cannot be determined via their raw data, and are often produced by third parties. They can be used for conditional finalization of terms in **agreements**.

Generally, validations are requested on [Statements](Statements.md) or other [Validations](Validations.md) by the underlying statement creator, and returned asynchronously in an event emission.

## Requests

Validation requests don't have a consistent abstract interface, because they can vary a lot based on what the validation is for. Often, they will accept statement or other other validation attestations to be validated, along with additional parameters specifying the properties to be validated if they aren't already defined in the base attestations.

## Checks

Validators implement [IArbiter](../../Implementations/Exchange/IArbiter.md), and their implementation of `checkStatement(Attestation memory statement, bytes memory demand, bytes32 counteroffer)` should be interpreted as checking a validation according to parametrized demands. The `counteroffer` UID is explicitly passed in because a demand is often specified in a counteroffer attestation, but it's impossible to know the UID of an attestation before it's created. 

It's good practice to call `IArbiter(statement).checkStatement` inside a statement validator's implementation of `checkStatement`, so that [Statements](Statements.md) can specify a single arbiter as the source of truth inside finalization clauses.
## Emission

Often, validations must be produced asynchronously via a function call by an off-chain oracle or another contract. One way to implement this, as demonstrated in [OptimisticStringValidator](../../Implementations/Exchange/Validations/OptimisticStringValidator.md), is optimistic mediation, where `checkStatement` is implemented to return valid after a given mediation period unless mediation is requested, in which case the validation attestation is revoked if it's invalid.

Another way is to produce the attestation asynchronously, only after validation actually happens. An event should be emitted when validations are produced if this architecture is used, but the event is not defined in [IValidator](../../Implementations/Exchange/IValidator.md) (\*subject to change), because architectural details vary too much per validation scheme.

## Examples
- Oracle-based validators can have off-chain entities produce a validation attestation on request. E.g., to retry a deterministic compute job and verify its correctness
- Reputation validators can accept collateral and produce positive validations for a particular entity's statements by default, while allowing authority oracles or a network of anonymous informers to revoke validations and slash collateral for entities that misbehave
- Combination validators can accept several other validations and combine them into a single one - e.g., indicating that all of them are valid, or that their sum fulfills some condition