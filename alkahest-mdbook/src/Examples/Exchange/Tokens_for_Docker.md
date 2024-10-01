# Tokens for Docker

We would like to trade [ERC20 tokens](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/ERC20PaymentStatement.sol) for [Docker jobs](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/DockerResultStatement.sol). The simplest representation of a Docker job is actually quite similar to the [StringResultStatement](https://github.com/CoopHive/alkahest-mocks/blob/4215cf4f81387748b4f112e27a46c70f3bb5725a/src/Statements/StringResultStatement.sol) we made in [Hello World - Tokens for Strings](Hello_World_-_Tokens_for_Strings.md). We can represent both Docker queries and results as single strings - note that the interpretation of these strings happens off-chain, or on-chain but outside of the base [DockerResultStatement]((https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/DockerResultStatement.sol)) contract if [Validations](../../Components/For_Exchange/Validations.md) are implemented. For example,

- The query could be
	1. A Dockerfile as a raw string
	2. Some intermediate JSON/YAML job spec as a raw string
	3. A URL/IPFS CID pointing to a Dockerfile or intermediate job spec
	4. A URL/IPFS CID pointing to a folder archive containing a Dockerfile and build dependencies
- The result could be
	1. The contents of stdout after building and running the Docker container, as a raw string
	2. A URL/IPFS CID pointing to the contents of stdout after running the container
	3. A URL/IPFS CID pointing to a folder archive containing the contents of a special volume mounted to the container, plus special files for stdout and stderr

To keep the base statement implementation general enough to accommodate all these possible interpretations, we'll only have `checkStatement` validate whether the statement was intended to fulfill a particular counteroffer. Further validation checks, which could rely on a more specific interpretation of the job and query strings, should be implemented as [Validations](../../Components/For_Exchange/Validations.md).

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import {Attestation} from "@eas/Common.sol";
import {IEAS, AttestationRequest, AttestationRequestData} from "@eas/IEAS.sol";
import {ISchemaRegistry} from "@eas/ISchemaRegistry.sol";
import {IStatement} from "../IStatement.sol";

contract DockerResultStatement is IStatement {
    struct StatementData {
        string resultCID;
    }

    struct DemandData {
        string queryCID;
    }

    error InvalidResultAttestation();
    error InvalidDemand();

    string public constant SCHEMA_ABI = "string resultCID";
    string public constant DEMAND_ABI = "string queryCID";
    bool public constant IS_REVOCABLE = false;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry)
        IStatement(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {}

    function makeStatement(StatementData calldata data, bytes32 refUID) public returns (bytes32) {
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

    function checkStatement(
        Attestation memory statement,
        bytes memory demand, /* (string queryCID) */
        bytes32 counteroffer
    ) public view override returns (bool) {
        if (!_checkIntrinsic(statement)) return false;

        // Check if the statement is intended to fulfill the specific counteroffer
        if (statement.refUID != bytes32(0) && statement.refUID != counteroffer) return false;

        StatementData memory result = abi.decode(statement.data, (StatementData));
        DemandData memory demandData = abi.decode(demand, (DemandData));

        return true;
    }

    function getSchemaAbi() public pure override returns (string memory) {
        return SCHEMA_ABI;
    }

    function getDemandAbi() public pure override returns (string memory) {
        return DEMAND_ABI;
    }
}
```

Buyers and sellers using this statement as one side of a trade will have to agree on the interpretation of resultCID and queryCID. This negotiation could be at the level of a marketplace where all deals use a particular interpretation, or at the level of an off-chain negotiation schema where buyers and sellers communicate how the result and query are to be interpreted in addition to the statement schema fields themselves.

[Apiary](https://github.com/CoopHive/Apiary/) is an implementation of a simple marketplace where `queryCID` is interpreted as a Lighthouse IPFS CID pointing to a Dockerfile and `resultCID` is a CID pointing to the results of stdout after building and running that Dockerfile.

Notice the layers of abstraction. The [rust bindings](https://github.com/CoopHive/Apiary/blob/main/src/lib.rs) to [ERC20PaymentStatement](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/ERC20PaymentStatement.sol) and [DockerResultStatement](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/DockerResultStatement.sol) in interaction with each other depend on these particular statements - for example, trading an ERC721 token rather than an ERC20 token for a Docker job would require a new contract and new bindings - but are still agnostic to the interpretation of the result and query in DockerResultStatement.

The interpretation of the result and query strings as Lighthouse IPFS CIDS referring to a Dockerfile and a string output from stdout happens in the [buyer](https://github.com/CoopHive/Apiary/blob/bdd0db5b0761f4dc6a87f2e012caf0bad74c57a5/apiary/buyer.py) and [seller](https://github.com/CoopHive/Apiary/blob/bdd0db5b0761f4dc6a87f2e012caf0bad74c57a5/apiary/seller.py) [Agents](../../Components/For_Negotiation/Agents.md), which can import the smart contract client opaquely. Neither the smart contracts nor the Rust SDK would have to be changed to reinterpret the result and query CIDS - say as archives, or Nix flakes.

See the final contracts at
- [DockerResultStatement](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/DockerResultStatement.sol)
- [ERC20PaymentStatement](https://github.com/CoopHive/tokens-for-docker-alkahest/blob/b7a79093684fe31863228f16306a285bf9db0e25/src/statements/ERC20PaymentStatement.sol)
and the example end-to-end market implementation at
- [Apiary](https://github.com/CoopHive/Apiary/)