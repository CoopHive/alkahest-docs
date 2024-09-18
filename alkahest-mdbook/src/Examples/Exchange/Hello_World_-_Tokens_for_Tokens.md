# Hello World - Tokens for Tokens

We would like to trade one [ERC20PaymentStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/ERC20PaymentStatement.sol) for another. Naively, we might try to specify the same contract as the arbiter when creating a statement, but we run into an issue.

Let's say Alice wants to pay` 100 * 10 ** 18` of TKA for `200 * 10 ** 18` of TKB.

```solidity
tka = new MockERC20("Token A", "TKA");
tkb = new MockERC20("Token B", "TKB");

paymentStatement = new ERC20PaymentStatement(eas, schemaRegistry);
ERC20PaymentStatement.StatementData memory paymentData =
	ERC20PaymentStatement.StatementData({
        token: address(tka),
        amount: 100 * 10 ** 18,
        arbiter: address(paymentStatement),
        demand: abi.encode(ERC20PaymentStatement.StatementData({
	        token: address(tkb),
	        amount: 200 * 10 ** 18,
	        arbiter: address(paymentStatement),
	        demand: ???
        }))
    });
```


Alice wants to demand that Bob is demanding the statement she's making right now, because she would like to use the attestation she's making to claim Bob's token payment (see [Hello World - Tokens for Strings](Hello_World_-_Tokens_for_Strings.md) for more detail on how this works). But this leads to an infinitely recursive definition - she can't fully specify the demand she expects Bob to make, because it has to refer to her statement, which has to refer to Bob's statement, ad infinitum.

## System Requirements

First, let's clarify the requirements of the system we'd like.
- Alice wants to make a payment deposit in TKA, demanding an amount of TKB
- Bob can claim Alice's payment if he makes a payment deposit for the amount of TKB that Alice set as her price, which Alice is able to claim
- If Bob can claim Alice's payment, then Alice and only Alice can claim Bob's payment
- The order in which Alice and Bob collect the other's payment shouldn't matter
- Each payment should only be able to be collected once

There are a few things about [ERC20PaymentStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/ERC20PaymentStatement.sol) that we have to be careful about.
- Payment attestations are revoked after they're collected, which means that `checkStatement` still return false when called on collected payments, since `checkStatement` calls `_checkIntrinsic`, which includes a check to if the attestation is revoked.
- The attestation used to collect a payment is not revoked after collecting the payment. The same payment can't be collected more than once, since the payment is revoked after collection, but the same attestation could be used to collect multiple payments.

Note that [Statements](../../Components/For_Exchange/Statements.md) and [Validations](../../Components/For_Exchange/Validations.md) contracts only have authority over attestations they produce themselves, which means that contracts can't revoke attestations made by other contracts. If we want to implement a mechanism where a certain attestation can only be used once before being revoked, this has to be implemented as a function on the contract making the use-once attestation, where its implementation of `checkStatement` only returns valid while the attestation is being used from that special function, which revokes the attestation afterwards.

However, we don't actually need such a mechanism for this case, since payment attestations being revoked after collection already prevents double spending as long as we can ensure that the attestations able to collect a payment are actually eligible to. In other words, we only have to ensure that
- Bob can claim Alice's payment if he makes a payment deposit for the amount of TKB that Alice set as her price, which Alice is able to claim
- If Bob can claim Alice's payment, then Alice and only Alice can claim Bob's payment

The case of requiring a specific existing attestation as the fulfillment to your payment attestation (i.e. paying for a specific already-existing attestation) is common enough to have a special case in  [ERC20PaymentStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/ERC20PaymentStatement.sol).

```solidity
    function _isValidFulfillment(
        Attestation memory payment,
        Attestation memory fulfillment,
        StatementData memory paymentData
    ) internal view returns (bool) {
        // Special case: If the payment references this fulfillment, consider it valid
                if (payment.refUID != 0) return payment.refUID == fulfillment.uid;


        // Regular case: check using the arbiter
        return IArbiter(paymentData.arbiter).checkStatement(fulfillment, paymentData.demand, payment.uid);
    }
```

Before using the demanded arbiter to check the fulfillment attestation, we check if if the payment attestation explicitly references an attestation in its refUID. If so, we return true if the fulfillment is the explicitly specified one and false otherwise. This ensures that Alice and only Alice is able to collect Bob's payment, even after Alice's attestation has been revoked.

## PaymentFulfillmentValidator

Now we just need to ensure that Bob is able to collect Alice's payment. We can resolve the infinite mutual recursion mentioned at the beginning of this discussion by creating a new [Validations](../../Components/For_Exchange/Validations.md) contract which Alice specifies as the arbiter to her payment, rather than the [ERC20PaymentStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/ERC20PaymentStatement.sol) itself. Like the statement contract, this validator will check for a token address and amount, but will check for an explicit refUID rather than a demand. In other words, a payment attestation of Alice's demanded token and amount, which explicitly specifies Alice's payment attestation as its fulfillment, will be able to collect Alice's payment.

```solidity
    contract ERC20PaymentFulfillmentValidator is IValidator {
    struct ValidationData {
        address token;
        uint256 amount;
        bytes32 fulfilling;
    }

    struct DemandData {
        address token;
        uint256 amount;
    }

    event ValidationCreated(bytes32 indexed validationUID, bytes32 indexed paymentUID);

    error InvalidStatement();
    error InvalidValidation();

    string public constant SCHEMA_ABI = "address token, uint256 amount, bytes32 fulfilling";
    string public constant DEMAND_ABI = "address token, uint256 amount";
    bool public constant IS_REVOCABLE = true;

    ERC20PaymentStatement public immutable paymentStatement;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry, ERC20PaymentStatement _baseStatement)
        IValidator(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {
        paymentStatement = _baseStatement;
    }

    function createValidation(bytes32 paymentUID, ValidationData calldata validationData)
        external
        returns (bytes32 validationUID)
    {
        Attestation memory paymentAttestation = eas.getAttestation(paymentUID);
        if (paymentAttestation.schema != paymentStatement.ATTESTATION_SCHEMA()) revert InvalidStatement();
        if (paymentAttestation.revocationTime != 0) revert InvalidStatement();
        if (paymentAttestation.recipient != msg.sender) revert InvalidStatement();

        if (paymentAttestation.refUID != validationData.fulfilling) revert InvalidValidation();

        if (
            !paymentStatement.checkStatement(
                paymentAttestation,
                abi.encode(
                    ERC20PaymentStatement.StatementData({
                        token: validationData.token,
                        amount: validationData.amount,
                        arbiter: address(0),
                        demand: ""
                    })
                ),
                0
            )
        ) revert InvalidStatement();

        validationUID = eas.attest(
            AttestationRequest({
                schema: ATTESTATION_SCHEMA,
                data: AttestationRequestData({
                    recipient: msg.sender,
                    expirationTime: paymentAttestation.expirationTime,
                    revocable: paymentAttestation.revocable,
                    refUID: paymentUID,
                    data: abi.encode(validationData),
                    value: 0
                })
            })
        );

        emit ValidationCreated(validationUID, paymentUID);
    }

    function checkStatement(Attestation memory statement, bytes memory demand, bytes32 counteroffer)
        public
        view
        override
        returns (bool)
    {
        if (!_checkIntrinsic(statement)) return false;

        ValidationData memory validationData = abi.decode(statement.data, (ValidationData));
        DemandData memory demandData = abi.decode(demand, (DemandData));

        return validationData.fulfilling == counteroffer && validationData.token == demandData.token
            && validationData.amount >= demandData.amount;
    }

    function getSchemaAbi() public pure override returns (string memory) {
        return SCHEMA_ABI;
    }

    function getDemandAbi() public pure override returns (string memory) {
        return DEMAND_ABI;
    }
}

```

Notice a few points
- `createValidation` only creates an attestation if the conditions are valid, and does so immediately. `checkStatement` just checks that the validation attestation's properties match the demand's properties, without looking at the underlying statement, since the necessary checks were already done to create the validation.
- `createValidation` uses the underlying statement's implementation of `checkStatement` to validate the token type and amount, passing in `0` for the demanded demand, since arbiter and demand should be unused when specifying an explicit fulfillment.

In practice, Bob should bundle creating his payment attestation, creating his validation attestation, and collecting Alice's payment all into a single transaction, because we haven't actually ensured that only Bob specifically can collect Alice's payment. Somebody else could meet Alice's demands before Bob, and Alice would still be able to collect Bob's payment as well as whoever else fulfilled her demand. Bundling everything into one transaction ensures that Bob never creates a payment that Alice can collect unless he actually collects Alice's payment.

See the final contracts at
- [ERC20PaymentFulfillmentValidator](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Validators/ERC20PaymentFulfillmentValidator.sol)
- [ERC20PaymentStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/ERC20PaymentStatement.sol)
and some tests at [TokensForTokens](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/test/TokensForTokens.t.sol) 








