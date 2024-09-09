# Statements

**Statements** represent the fulfillment of a party's obligation in an **agreement**. They have three main parts - an initialization function, parametrized checks, and term finalizations.

## Initialization

Initializing a statement means doing all on-chain actions necessary to fulfill the obligation represented by the statement, and getting an attestation from the statement contract stating that you've done so. For example, in [[ERC20PaymentStatement]], the initialization function `makeStatement` requires a deposit of an ERC20 token which the counterparty is eligible to collect by producing a statement representing their side of the agreement.

Generally, the attestation produced by a statement will have the form `{offerData, arbiter, demand}`, where offerData has a particular type per statement contract (e.g. `address token, uint amount` in [[ERC20PaymentStatement]]). The other fields specify the demand the counterparty must fulfill to finalize the statement. Statements made in fulfillment of an existing statement can reference that statement in its refUID, and implement its finalization functions to check for this as a special case.

## Checks

Statements implement [[IArbiter]], including the abstract function `checkStatement(Attestation memory statement, bytes memory demand, bytes32 counteroffer)`, used to verify if a statement meets the specified demand. It checks if an attestation follows the correct schema, if it's still valid and not revoked, and if it meets the demands specified as `demand`, which for [[ERC20PaymentStatement]] is `address token, uint256 amount, address arbiter, bytes demand`, demanding at least a certain amount of a certain ERC20 token, as well as that a particular fulfillment is demanded, which will be usable to collect the payment.

A call to `IArbiter(address).checkStatement` on a trusted arbiter contract should be sufficient to determine that any untrusted attestation is actually a valid statement fulfilling a specified demand. Sometimes, the statement contract itself will not be able to sufficiently guarantee the validity of statements produced from itself, and counterparties will need to rely on [Validations](Validations.md) from other validators. In these cases, the statement's implementation of `checkStatement` is often still useful to validator contracts, which could guarantee additional properties on top of the statement contract's intrinsic guarantees.

## Finalizations

Finalizations can be thought of as asynchronous terms of statements, represented as functions from conditions to effects. Their conditions are typically represented as attestations, especially from contracts implementing [[IArbiter]] - i.e., [Statements](Statements.md) or [Validations](Validations.md). Conditions can vary per statement by depending on `arbiter` and `demand`, or interpretation of its EAS parameters, and common conditions like only being fulfillable by a specific counterparty are implemented as utilities in [[IStatement]] itself (\* coming soon).

For example, [[ERC20PaymentStatement]] has the finalization function `collectPayment(bytes32 payment, bytes32 fulfillment)`, which takes the UIDs of a payment and a fulfillment attestation. It checks if the either the payment attestation explicitly specifies the fulfillment attestation (by its refUID), or the fulfillment attestation fulfills the demands specified in the payment statement's `arbiter` and `demand` fields, and transfers the payment collateral to the caller if either condition holds.