Let's demonstrate the use of **statements** and **validations** by building an example marketplace where users buy string manipulations for ERC20 tokens. Buyers will be able to submit a token payment in an arbitrary ERC20 token, demanding a particular string to be capitalized. Sellers who submit a valid capitalization of the buyer's string, verified optimistically directly in a smart contract in our example, will be able to claim the buyer's token payment.

The components we implement along the way will also allow paying for any other task in ERC20 tokens, or selling on-chain validated string capitalizations for anything else, only requiring an implementation of the relevant counterparty component. The example optimistic mediation validator should also be extensible to support verification of much more complex tasks.
## Paying Tokens

[[Statements]] represent a party's fulfillment of one side of an agreement. The most basic exchange requires just two statements - one for the ask and one for the bid. We'll implement this first, then modify the implementation to support a pluggable validator contract.

Statements have three main parts - an initialization function, inherent validity checks, and term finalization functions. ion The initialization function is called by the party offering what the statement represents, and performs all on-chain actions necessary to enact its finalization terms, as well as for any relevant validators to validate the statement. Finalization functions represent individual conditions of an agreement, and can be called by the agreement counterparty, passing in the host contract statement and a statement or validation representing their side of the deal. Checks are what finalization functions use to parametrically assess validity of other statements. Let's make this clearer with an example.

To make a statement contract for ERC20 payments, we need the statement creator to deposit tokens into escrow, which are then available to be claimed by a valid counterparty. When other statements require ERC20 payments from a counterparty, they'll want to check if the at least a specified amount of a specified token is available for collection.

### Initialization
We'll first implement statement creation via depositing an ERC20 token and specifying what's demanded from the counterparty.

```solidity
contract ERC20PaymentStatement is IStatement {
    struct StatementData {
        address token;
        uint256 amount;
        address arbiter;
        bytes demand;
    }

    string public constant SCHEMA_ABI = "address token, uint256 amount, address arbiter, bytes demand";
    bool public constant IS_REVOCABLE = true;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry)
        IStatement(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {}

    function makeStatement(StatementData calldata data, uint64 expirationTime, bytes32 refUID)
        public
        returns (bytes32)
    {
        // require token transfer from attestation recipient
        IERC20(data.token).transferFrom(msg.sender, address(this), data.amount);

        return eas.attest(
            AttestationRequest({
                schema: ATTESTATION_SCHEMA,
                data: AttestationRequestData({
                    recipient: msg.sender,
                    expirationTime: expirationTime,
                    revocable: true,
                    refUID: refUID,
                    data: abi.encode(data),
                    value: 0
                })
            })
        );
    }

    function getSchemaAbi() public pure override returns (string memory) {
        return SCHEMA_ABI;
    }
}

```

Let's walk through it part by part.

`struct StatementData` is the data specific to each statement made from this contract. In this case, each statement represents depositing an `amount` of an arbitrary ERC20 `token`, specified by its contract address. `arbiter` and `demand` together represent what's demanded from the counterparty to collect payment, which we'll explain in more detail when implementing the `checkStatement` function required by [[IArbiter]]. `arbiter` is the contract whose implementation of `checkStatement` we accept as a source of truth on counterparty validity, and `demand` is passed into `IArbiter(arbiter).checkStatement` to allow parametrized demands.

`SCHEMA_ABI` is the ABI form of `StatementData`, and is returned from `getSchemaAbi`, which is a virtual function defined in [[IStatement]]. `SCHEMA_ABI` and `StatementData` themselves aren't actually part of [[IStatement]], but `getSchemaAbi` must return the statement data ABI as a string, because the EAS attestations that statement contracts produce will encode the data as bytes, which other contracts will sometimes want to decode.

The `constructor` is just a call to [[IStatement]]'s constructor with specialized parameters. It registers the statement schema with EAS and sets the schema UID as a public parameter on the contract called `ATTESTATION_SCHEMA`. EAS schemas specify if attestations are revokable or not, and in this case, they are, with revocation meaning the cancelation of an unfinished deal.

`makeStatement` is the statement's initialization function. Callers specify a token and amount, a demand for the counterparty, optionally an expiration time (0 if none), and optionally a refUID if the statement is fulfilling the demand of another specific existing statement. The role of refUID on statements will be explained in more detail when implementing [[StringResultStatement]]. The function transfers the specified amount of the specified token from the caller to the contract, produces an on-chain attestation with EAS containing the `StatementData` passed in, and returns the bytes32 UID of the attestation.
### Checks

The main thing counterparties will want to check about ERC20 payment statements is whether at least a specific amount of a specific token is deposited, with a specific demand. We'll implement `checkStatement` to enable this.

```solidity
contract ERC20PaymentStatement is IStatement {

	...
	
    string public constant DEMAND_ABI = "address token, uint256 amount, address arbiter, bytes demand";

	mapping(bytes32 => bytes32) public collectedFor;
    
	...

    function checkStatement(
        Attestation memory statement,
        bytes memory demand, /* (address token, uint256 amount, address arbiter, bytes demand) */
        bytes32 counteroffer
    ) public view override returns (bool) {
        if (!_checkIntrinsic(statement)) {
            // Check alternative valid condition for revoked statements
            return statement.schema == ATTESTATION_SCHEMA && statement.refUID != bytes32(0)
                && statement.refUID == counteroffer;
        }

        StatementData memory payment = abi.decode(statement.data, (StatementData));
        StatementData memory demandData = abi.decode(demand, (StatementData));

        return payment.token == demandData.token && payment.amount >= demandData.amount
            && payment.arbiter == demandData.arbiter && keccak256(payment.demand) == keccak256(demandData.demand);
    }

	...
	
    function getDemandAbi() public pure override returns (string memory) {
        return DEMAND_ABI;
    }
}
```

`DEMAND_ABI` for ERC20 payment statements is the same as `SCHEMA_ABI`, which will often but not always be the case. Here, counterparties want to know that a statement represents at least an `amount` of a `token` for a specific counteroffer, but `DEMAND_ABI` - or more precisely, the return of `getDemandAbi` - just represents parameters passed into `checkStatement`.

`collectedFor` will record what counteroffers payments are collected for, and is used in `checkStatement`. 

`checkStatement` considers two conditions valid:
1. The statement is produced by this contract and active (not expired nor revoked). It contains at least the demanded amount of the demanded token, available for collection.
2. The statement is produced by this contract and has already been collected for the specified counteroffer. This check is needed so that payments that have already been collected can still be used to finalize counterparty statements.

### Finalization

To complete our ERC20 payment statement, we'll add functions for collecting payments and cancelling statements.

```solidity
contract ERC20PaymentStatement is IStatement {
	...
	error InvalidPaymentAttestation();
    error InvalidFulfillment();
    error UnauthorizedCall();
	...
	mapping(bytes32 => bytes32) public collectedFor;
	...
    
    function collectPayment(bytes32 _payment, bytes32 _fulfillment) public returns (bool) {
        Attestation memory payment = eas.getAttestation(_payment);
        Attestation memory fulfillment = eas.getAttestation(_fulfillment);

        if (!_checkIntrinsic(payment)) revert InvalidPaymentAttestation();

        if (payment.refUID != bytes32(0) && payment.refUID != _fulfillment) {
            revert InvalidFulfillment();
        }

        StatementData memory paymentData = abi.decode(payment.data, (StatementData));

        if (!IArbiter(paymentData.arbiter).checkStatement(fulfillment, paymentData.demand, _payment)) {
            revert InvalidFulfillment();
        }

        collectedFor[_payment] = _fulfillment;
        eas.revoke(
            RevocationRequest({schema: ATTESTATION_SCHEMA, data: RevocationRequestData({uid: _payment, value: 0})})
        );
        return IERC20(paymentData.token).transfer(fulfillment.recipient, paymentData.amount);
    }

    function cancelStatement(bytes32 uid) public returns (bool) {
        Attestation memory attestation = eas.getAttestation(uid);
        if (msg.sender != attestation.recipient) revert UnauthorizedCall();

        eas.revoke(RevocationRequest({schema: ATTESTATION_SCHEMA, data: RevocationRequestData({uid: uid, value: 0})}));

        StatementData memory data = abi.decode(attestation.data, (StatementData));
        return IERC20(data.token).transfer(msg.sender, data.amount);
    }
}
```

We add the three errors `InvalidPaymentAttestation`, `InvalidFulfillment`, and `UnauthorizedCall` as possible failure modes during payment collection or cancellation.

`collectedFor` keeps track of what counteroffer statement payments are collected for, as used in the second validation condition in `checkStatement`. This ensures that statements for already-collected payments can only be used to finalize the statement that was actually used to collect the payment.

`collectPayment` is called by the counterparty to claim a payment. First, it checks if the payment is actually issued by this contract, and still active (i.e. not expired, canceled or collected). It then checks if the payment is for a specific counteroffer, and whether the attestation provided corresponds to that counteroffer.  Finally, it checks if the fulfillment attestation fulfills the payments demands, and if so, revokes the payment attestation, records the fulfillment attestation as `collectedFor[_payment]`, and transfers the token collateral deposited when the payment was made to the caller.

`cancelStatement` allows a payment statement creator to revoke their statement, reclaiming their tokens and ending an agreement prematurely. Note that this basic implementation of `cancelStatement` shouldn't be directly used in production, since there are no protection checks or collateral to ensure that a buyer can't cancel their payment after a seller has already provided them with a benefit, but before the seller has had time to claim their payment.

For cases where the seller's obligation can be finalized on-chain in one block, including this example, this can be mitigated by bundling sell-side statement creation and payment collection into a single transaction, but for more complex exchanges, a more robust protection and collateral system is recommended.

See the final contract at [[Implementations/Exchange/Statements/ERC20PaymentStatement|ERC20PaymentStatement]].
## Submitting Strings

To complement our ERC20 payment statement, we'll implement a statement contract for submitting string results. This will allow sellers to provide uppercased strings in response to buyers' queries. The string result statement will be non-revocable and non-expiring, as the result, once recorded on-chain, is available indefinitely.

### Initialization

We'll start by implementing statement creation for submitting string results:

```solidity
contract StringResultStatement is IStatement {
    struct StatementData {
        string result;
    }

    struct DemandData {
        string query;
    }

    string public constant SCHEMA_ABI = "string result";
    string public constant DEMAND_ABI = "string query";
    bool public constant IS_REVOCABLE = false;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry)
        IStatement(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {}

    function makeStatement(StatementData calldata data, bytes32 refUID)
        public
        returns (bytes32)
    {
        return eas.attest(
            AttestationRequest({
                schema: ATTESTATION_SCHEMA,
                data: AttestationRequestData({
                    recipient: msg.sender,
                    expirationTime: 0,
                    revocable: false,
                    refUID: refUID,
                    data: abi.encode(data),
                    value: 0
                })
            })
        );
    }
}
```

Let's break it down:

`struct StatementData` contains only the `result` string, which is the capitalized version of the query.

`struct DemandData` represents the demand structure, which only includes the `query` string to be capitalized.

`SCHEMA_ABI` and `DEMAND_ABI` are simplified to reflect the reduced data structures.

`IS_REVOCABLE` is set to `false`, as string results, once recorded on-chain, cannot be meaningfully revoked.

The `constructor` remains similar, registering the statement schema with EAS.

`makeStatement` is the initialization function for creating a string result statement. It creates a non-revocable, non-expiring on-chain attestation with EAS containing the `StatementData` and returns the attestation's UID.
### Checks

For string result statements, we'll implement `checkStatement` to verify if a submitted result is the correctly capitalized version of the query:

```solidity
contract StringResultStatement is IStatement {
    function checkStatement(
        Attestation memory statement,
        bytes memory demand, /* (string query) */
        bytes32 counteroffer
    ) public view override returns (bool) {
        if (!_checkIntrinsic(statement)) {
            return false;
        }

        // Check if the statement is intended to fulfill the specific counteroffer
        if (statement.refUID != bytes32(0) && statement.refUID != counteroffer) {
            return false;
        }

        StatementData memory result = abi.decode(statement.data, (StatementData));
        DemandData memory demandData = abi.decode(demand, (DemandData));

        return _isCapitalized(demandData.query, result.result);
    }

    function _isCapitalized(string memory query, string memory result) internal pure returns (bool) {
        bytes memory queryBytes = bytes(query);
        bytes memory resultBytes = bytes(result);

        if (queryBytes.length != resultBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < queryBytes.length; i++) {
            if (queryBytes[i] >= 0x61 && queryBytes[i] <= 0x7A) {
                // If lowercase, it should be capitalized in the result
                if (uint8(resultBytes[i]) != uint8(queryBytes[i]) - 32) {
                    return false;
                }
            } else {
                // If not lowercase, it should remain the same
                if (resultBytes[i] != queryBytes[i]) {
                    return false;
                }
            }
        }

        return true;
    }
}
```

`checkStatement` verifies that:

1. The statement is produced by this contract.
2. If the statement has a non-zero `refUID`, it matches the provided `counteroffer`.
3. The submitted result is the correctly capitalized version of the query.

The `_isCapitalized` function performs a character-by-character comparison to ensure the result is the correctly capitalized version of the query. We use explicit type coercion to `uint8` when comparing character values to ensure correct arithmetic operations.

### Finalization

As before, the string result statement doesn't require a separate finalization step. Once a statement is created, it's immediately available for validation and use by counterparties. The non-revocable and non-expiring nature of these statements means that they persist indefinitely on-chain.

This simplified implementation of `StringResultStatement` complements the `ERC20PaymentStatement`, allowing for a straightforward exchange system where users can pay in ERC20 tokens for uppercased strings. In the next section on validation, we'll modify this implementation to perform a simpler check (like comparing string lengths) and defer the full capitalization check to an external validator.

See the final contract at [[Implementations/Exchange/Statements/StringResultStatement|StringResultStatement]].
## In Practice (Solidity)

Let's walk through a practical example of how users would interact with the `ERC20PaymentStatement` and `StringResultStatement` contracts to facilitate a trade of ERC20 tokens for an uppercased string.

### Setting Up the Trade

1. The buyer (Alice) wants to pay 10 USDC for the uppercased version of the string "hello world".
2. Alice creates an ERC20 payment statement:

```
ERC20PaymentStatement.StatementData memory paymentData = ERC20PaymentStatement.StatementData({
    token: address(USDC),
    amount: 10 * 10**6, // Assuming 6 decimal places for USDC
    arbiter: address(stringResultStatement), // The StringResultStatement contract acts as the arbiter
    demand: abi.encode(StringResultStatement.DemandData({
        query: "hello world"
    }))
});

bytes32 paymentUID = erc20PaymentStatement.makeStatement(paymentData, 0, bytes32(0));
```

This creates an on-chain attestation representing Alice's offer to pay 10 USDC for the uppercased version of "hello world".

### Fulfilling the Trade

3. The seller (Bob) sees Alice's offer and decides to fulfill it. Bob creates a string result statement:
```solidity
StringResultStatement.StatementData memory resultData = StringResultStatement.StatementData({
    result: "HELLO WORLD"
});

bytes32 resultUID = stringResultStatement.makeStatement(resultData, paymentUID);
```

This creates an on-chain attestation representing Bob's fulfillment of Alice's request. Note that the `refUID` is set to `paymentUID`, linking this result to Alice's specific payment offer.

### Completing the Exchange

4. Bob can now complete the exchange by calling `collectPayment` on the `ERC20PaymentStatement` contract:
```solidity
erc20PaymentStatement.collectPayment(paymentUID, resultUID);
```

This function will:

- Verify that the payment statement is valid and hasn't been collected.
- Check that the result statement matches the payment's demand (correct query).
- Use the `StringResultStatement` contract (specified as the arbiter) to validate that the result is correctly capitalized.
- If all checks pass, transfer the USDC from the contract to Bob.

### Key Points

- The `arbiter` in the payment statement is set to the `StringResultStatement` contract address. This means the `ERC20PaymentStatement` contract will use the `StringResultStatement`'s `checkStatement` function to validate the result.
- The `demand` field in the payment statement contains the encoded `DemandData` from the `StringResultStatement`. This specifies exactly what string needs to be capitalized.
- The `refUID` in the result statement is set to the payment statement's UID. This creates a direct link between the offer and its fulfillment, ensuring that a result can only be used to collect the payment it was intended for.
- Only Bob (the creator of the result statement) can collect the payment. This is enforced by the `collectPayment`function checking if `msg.sender` is the recipient of the fulfillment attestation.
- The `StringResultStatement` doesn't need to specify an arbiter or demand, as it's not responsible for finalizing any other statements.

This system provides a trustless way for users to exchange ERC20 tokens for specific string manipulations, with on-chain verification of the results. The use of EAS attestations for both the payment and the result provides a standardized and extensible foundation for more complex exchanges.

In the next section, we'll explore how to replace the direct use of `StringResultStatement` as an arbiter with a separate validator contract, demonstrating the pluggable nature of arbiters in this system.

## In Practice (TypeScript + viem)
Let's walk through how users would interact with the `ERC20PaymentStatement` and `StringResultStatement` contracts using viem's contract instances API and TypeScript to facilitate a trade of ERC20 tokens for an uppercased string.

### Setting Up the Environment

First, we set up our environment with viem:
```typescript
import { createPublicClient, createWalletClient, http, parseAbi, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http()
});

// Replace with actual private keys (never hardcode in production!)
const aliceAccount = privateKeyToAccount('0xalice_private_key');
const bobAccount = privateKeyToAccount('0xbob_private_key');

// Contract addresses (replace with actual deployed addresses)
const ERC20_PAYMENT_STATEMENT_ADDRESS = '0x...' as `0x${string}`;
const STRING_RESULT_STATEMENT_ADDRESS = '0x...' as `0x${string}`;
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const statementAbi = parseAbi([
  'function getDemandAbi() public view returns (string)',
  'function getSchemaAbi() public view returns (string)',
  'function makeStatement(tuple data, uint64 expirationTime, bytes32 refUID) public returns (bytes32)',
  'function collectPayment(bytes32 payment, bytes32 fulfillment) public returns (bool)',
]);

const erc20PaymentStatement = getContract({
  address: ERC20_PAYMENT_STATEMENT_ADDRESS,
  abi: statementAbi,
  publicClient,
  walletClient,
});

const stringResultStatement = getContract({
  address: STRING_RESULT_STATEMENT_ADDRESS,
  abi: statementAbi,
  publicClient,
  walletClient,
});
```
### Setting Up the Trade

1. Alice wants to pay 10 USDC for the uppercased version of the string "hello world".
2. Alice creates an ERC20 payment statement:
```typescript
async function createPaymentStatement() {
  const stringResultDemandAbi = await stringResultStatement.read.getDemandAbi();
  const paymentSchemaAbi = await erc20PaymentStatement.read.getSchemaAbi();

  const demandData = encodeAbiParameters(
    parseAbi([stringResultDemandAbi]),
    [{ query: 'hello world' }]
  );

  const paymentData = encodeAbiParameters(
    parseAbi([paymentSchemaAbi]),
    [{
      token: USDC_ADDRESS,
      amount: 10_000_000n, // 10 USDC (6 decimals)
      arbiter: STRING_RESULT_STATEMENT_ADDRESS,
      demand: demandData,
    }]
  );

  const paymentHash = await erc20PaymentStatement.write.makeStatement(
    [paymentData, 0n, '0x' + '0'.repeat(64)],
    { account: aliceAccount }
  );

  console.log('Payment statement created:', paymentHash);

  const paymentReceipt = await publicClient.waitForTransactionReceipt({ hash: paymentHash });
  const paymentUID = extractPaymentUIDFromLogs(paymentReceipt.logs);
  return paymentUID;
}
```
### Fulfilling the Trade

3. Bob sees Alice's offer and decides to fulfill it. Bob creates a string result statement:
```typescript
async function createResultStatement(paymentUID: `0x${string}`) {
  const stringResultSchemaAbi = await stringResultStatement.read.getSchemaAbi();

  const resultData = encodeAbiParameters(
    parseAbi([stringResultSchemaAbi]),
    [{ result: 'HELLO WORLD' }]
  );

  const resultHash = await stringResultStatement.write.makeStatement(
    [resultData, paymentUID],
    { account: bobAccount }
  );

  console.log('Result statement created:', resultHash);

  const resultReceipt = await publicClient.waitForTransactionReceipt({ hash: resultHash });
  const resultUID = extractResultUIDFromLogs(resultReceipt.logs);
  return resultUID;
}
```
### Completing the Exchange

4. Bob can now complete the exchange by calling `collectPayment` on the `ERC20PaymentStatement` contract:
```typescript
async function collectPayment(paymentUID: `0x${string}`, resultUID: `0x${string}`) {
  const collectHash = await erc20PaymentStatement.write.collectPayment(
    [paymentUID, resultUID],
    { account: bobAccount }
  );

  console.log('Payment collected:', collectHash);
}
```
### Putting It All Together
```typescript
async function trade() {
  const paymentUID = await createPaymentStatement();
  const resultUID = await createResultStatement(paymentUID);
  await collectPayment(paymentUID, resultUID);
}

trade().catch(console.error);
```

# Validators

In our initial implementation of the exchange system, we used statement contracts to represent both offers and results. While this approach works for simple exchanges, it has several limitations when dealing with more complex scenarios:

1. **Coupling of Logic**: The validation logic is tightly coupled with the statement creation logic. This makes it difficult to update or change the validation process without affecting existing statements.

2. **Limited Flexibility**: Simple statement contracts can't easily handle complex validation scenarios, such as those requiring multiple steps, off-chain data, or time-delayed challenges.

3. **Scalability Issues**: As validation logic becomes more complex, statement contracts can become bloated and expensive to deploy and interact with.

4. **Lack of Reusability**: Validation logic implemented directly in statement contracts can't be easily reused across different types of exchanges.

5. **Difficulty in Upgrading**: Once deployed, the validation logic in a statement contract can't be easily upgraded or modified.

To address these limitations, we introduce the concept of validator contracts. Validators act as an intermediary between offer statements and result statements, providing a flexible and extensible way to implement complex validation logic.

## Validators: Bridging Statements and Arbiters

Validators extend the concept of arbiters, providing more complex and flexible validation mechanisms. They act as a bridge between offer statements (like `ERC20PaymentStatement`) and result statements (like `StringResultStatement`), allowing for sophisticated validation logic without complicating the base statement contracts.

Let's first recap the roles of statements and arbiters in our system to better understand how validators fit into the picture.

### Recap: Statements and Arbiters

Statements represent a party's fulfillment of one side of an agreement. They have three main components:

1. Initialization: Functions that set up the statement, often involving on-chain actions like token transfers.
2. Checks: Functions that assess the validity of other statements or validations.
3. Finalization: Functions that complete the agreement, often transferring assets or updating state.

Arbiters, on the other hand, are contracts that can check the validity of statements. Both statement contracts and validator contracts implement the `IArbiter` interface, allowing them to be used interchangeably in many contexts.

### Validator Structure

While validators can vary significantly in their implementation, they generally include the following components:

1. Initialization:
   - Functions to start the validation process, often creating a new attestation or record.
   - May involve setup steps like staking tokens or registering with external services.

2. Validation Logic:
   - The core logic for checking the validity of a result.
   - Can range from simple on-chain checks to complex multi-step processes involving off-chain data.

3. Finalization:
   - Functions to conclude the validation process.
   - May involve releasing stakes, updating state, or triggering further on-chain actions.

4. Arbitration Interface:
   - Implementation of the `IArbiter` interface, allowing the validator to be used as an arbiter in statement contracts.

### Types of Validators

Validators can implement various validation strategies, including:

1. Optimistic Validation:
   - Results are considered valid unless challenged within a specific time frame.
   - Includes a challenge mechanism and often involves staking.

2. Oracle-based Validation:
   - Relies on external data providers (oracles) to verify results.
   - May involve paying for the oracle service.

3. Multi-step Validation:
   - Requires multiple validation steps or approvals from different parties.

4. Threshold Validation:
   - Requires a certain number or percentage of validators to approve the result.

5. Computation Validation:
   - Performs complex on-chain computations to verify results.
   - May use zero-knowledge proofs for efficiency.

By introducing validators, we can overcome the limitations of bare statements:

1. **Decoupling of Logic**: Validation logic is separated from statement creation, allowing for more flexible and upgradeable systems.
2. **Increased Flexibility**: Validators can implement complex validation scenarios that would be impractical in simple statement contracts.
3. **Improved Scalability**: Complex logic is moved to separate contracts, keeping statement contracts lean and efficient.
4. **Enhanced Reusability**: Validation logic in validator contracts can be easily reused across different types of exchanges.
5. **Easier Upgrades**: Validator contracts can be designed to be upgradeable, allowing for improvements over time without affecting existing statements.

Let's implement an example of an optimistic validator to see how these concepts come together in practice.
## Implementing an Optimistic Validator

We'll create an `OptimisticStringValidator` that implements optimistic validation with a challenge period. This validator will check if a string has been correctly capitalized, allowing for a period during which the result can be challenged.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import {Attestation} from "@eas/Common.sol";
import {IEAS, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData} from "@eas/IEAS.sol";
import {ISchemaRegistry} from "@eas/ISchemaRegistry.sol";
import {IStatement} from "./IStatement.sol";
import {IArbiter} from "./IArbiter.sol";

contract OptimisticStringValidator is IStatement {
    struct ValidationData {
        string query;
        uint64 mediationPeriod;
    }

    event ValidationStarted(bytes32 indexed validationUID, bytes32 indexed resultUID, string query);
    event MediationRequested(bytes32 indexed validationUID, bool success);

    error InvalidValidationSchema();
    error MediationPeriodExpired();
    error InvalidStatementSchema();
    error StatementRevoked();
    error QueryMismatch();
    error MediationPeriodMismatch();

    string public constant SCHEMA_ABI = "string query, uint64 mediationPeriod";
    string public constant DEMAND_ABI = "string query, uint64 mediationPeriod";
    bool public constant IS_REVOCABLE = true;

    address public immutable BASE_STATEMENT;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry, address _baseStatement)
        IStatement(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {
        BASE_STATEMENT = _baseStatement;
    }

    // Initialization
    function startValidation(bytes32 resultUID, string calldata query, uint64 mediationPeriod)
        external
        returns (bytes32 validationUID_)
    {
        ValidationData memory data = ValidationData({query: query, mediationPeriod: mediationPeriod});

        validationUID_ = eas.attest(
            AttestationRequest({
                schema: ATTESTATION_SCHEMA,
                data: AttestationRequestData({
                    recipient: msg.sender,
                    expirationTime: uint64(block.timestamp) + mediationPeriod,
                    revocable: true,
                    refUID: resultUID,
                    data: abi.encode(data),
                    value: 0
                })
            })
        );

        emit ValidationStarted(validationUID_, resultUID, query);
    }

    // Validation Logic (part of the Arbiter interface)
    function checkStatement(Attestation memory statement, bytes memory demand, bytes32 counteroffer)
        public
        view
        override
        returns (bool)
    {
        if (statement.schema != ATTESTATION_SCHEMA) revert InvalidStatementSchema();
        if (statement.revocationTime != 0) revert StatementRevoked();

        (string memory query, uint64 mediationPeriod) = abi.decode(demand, (string, uint64));
        ValidationData memory data = abi.decode(statement.data, (ValidationData));

        if (keccak256(bytes(data.query)) != keccak256(bytes(query))) revert QueryMismatch();
        if (data.mediationPeriod != mediationPeriod) revert MediationPeriodMismatch();

        if (block.timestamp <= statement.time + data.mediationPeriod) {
            return false;
        }

        return IArbiter(BASE_STATEMENT).checkStatement(
            eas.getAttestation(statement.refUID), abi.encode(data.query), counteroffer
        );
    }

    // Finalization (Mediation)
    function mediate(bytes32 validationUID) external returns (bool success_) {
        Attestation memory validation = eas.getAttestation(validationUID);
        if (validation.schema != ATTESTATION_SCHEMA) revert InvalidValidationSchema();

        ValidationData memory data = abi.decode(validation.data, (ValidationData));
        if (block.timestamp > validation.time + data.mediationPeriod) revert MediationPeriodExpired();

        Attestation memory resultAttestation = eas.getAttestation(validation.refUID);
        success_ = _isCapitalized(data.query, abi.decode(resultAttestation.data, (string)));

        if (!success_) {
            eas.revoke(
                RevocationRequest({
                    schema: ATTESTATION_SCHEMA,
                    data: RevocationRequestData({uid: validationUID, value: 0})
                })
            );
        }

        emit MediationRequested(validationUID, success_);
    }

    // Helper function for validation logic
    function _isCapitalized(string memory query, string memory result) internal pure returns (bool) {
        bytes memory queryBytes = bytes(query);
        bytes memory resultBytes = bytes(result);

        if (queryBytes.length != resultBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < queryBytes.length; i++) {
            if (queryBytes[i] >= 0x61 && queryBytes[i] <= 0x7A) {
                // If lowercase, it should be capitalized in the result
                if (uint8(resultBytes[i]) != uint8(queryBytes[i]) - 32) {
                    return false;
                }
            } else {
                // If not lowercase, it should remain the same
                if (resultBytes[i] != queryBytes[i]) {
                    return false;
                }
            }
        }

        return true;
    }

    // Implementing required functions from IStatement
    function getSchemaAbi() public pure override returns (string memory) {
        return SCHEMA_ABI;
    }

    function getDemandAbi() public pure override returns (string memory) {
        return DEMAND_ABI;
    }
}
```

This validator demonstrates the key components we discussed:

1. Initialization: The `startValidation` function initializes the validation process.
2. Validation Logic: The `checkStatement` function implements the core validation logic.
3. Finalization: The `mediate` function allows for challenges during the mediation period.
4. Arbitration Interface: The contract implements `IStatement`, which extends `IArbiter`.

## Using Validators in the Exchange System

To use a validator in our exchange system:

1. Deploy the validator contract.
2. When creating an offer statement (e.g., `ERC20PaymentStatement`), specify the validator as the arbiter:

```solidity
ERC20PaymentStatement.StatementData memory paymentData = ERC20PaymentStatement.StatementData({
    token: address(USDC),
    amount: 10 * 10**6,
    arbiter: address(optimisticStringValidator),
    demand: abi.encode(OptimisticStringValidator.ValidationData({
        query: "hello world",
        mediationPeriod: 1 days
    }))
});

bytes32 paymentUID = erc20PaymentStatement.makeStatement(paymentData, 0, bytes32(0));
```

3. When submitting a result, start the validation process:

```solidity
bytes32 resultUID = stringResultStatement.makeStatement(resultData, paymentUID);
bytes32 validationUID = optimisticStringValidator.startValidation(resultUID, "hello world", 1 days);
```

4. To complete the exchange, use the validation UID when collecting the payment:

```solidity
erc20PaymentStatement.collectPayment(paymentUID, validationUID);
```

## Beyond Optimistic Validation

While we've implemented an optimistic validator here, other types of validators might work differently. For example:

- An oracle-based validator might require payment to cover the cost of off-chain verification.
- A multi-step validator might require approvals from multiple parties before considering a result valid.
- A computation validator might perform complex on-chain calculations or verify zero-knowledge proofs.

The flexibility of this system allows for a wide range of validation strategies to be implemented and used interchangeably, depending on the specific requirements of each exchange.

By separating validators from base statements, we've created a modular and extensible system that can adapt to various validation needs while keeping the core exchange logic simple and consistent.

See the final contracts at
- [[IArbiter]]
- [[IStatement]]
- [[ERC20PaymentStatement]]
- [[StringResultStatement]]
- [[OptimisticMediationValidation]]