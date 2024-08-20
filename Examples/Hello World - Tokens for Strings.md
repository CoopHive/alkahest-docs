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
                schema: attestationSchema,
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

The `constructor` is just a call to [[IStatement]]'s constructor with specialized parameters. It registers the statement schema with EAS and sets the schema UID as a public parameter on the contract called `attestationSchema`. EAS schemas specify if attestations are revokable or not, and in this case, they are, with revocation meaning the cancelation of an unfinished deal.

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
            return statement.schema == attestationSchema && statement.refUID != bytes32(0)
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

## Submitting Strings

## Validation
