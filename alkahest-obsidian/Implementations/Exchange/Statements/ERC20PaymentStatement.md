```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import {Attestation} from "@eas/Common.sol";
import {
    IEAS, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData
} from "@eas/IEAS.sol";
import {ISchemaRegistry} from "@eas/ISchemaRegistry.sol";
import {IERC20} from "@openzeppelin/token/ERC20/IERC20.sol";
import {IStatement} from "./IStatement.sol";
import {IArbiter} from "./IArbiter.sol";

contract ERC20PaymentStatement is IStatement {
    struct StatementData {
        address token;
        uint256 amount;
        address arbiter;
        bytes demand;
    }

    error InvalidPaymentAttestation();
    error InvalidFulfillment();
    error UnauthorizedCall();

    string public constant SCHEMA_ABI = "address token, uint256 amount, address arbiter, bytes demand";
    string public constant DEMAND_ABI = "address token, uint256 amount, address arbiter, bytes demand";
    bool public constant IS_REVOCABLE = true;

    mapping(bytes32 => bytes32) public collectedFor;

    constructor(IEAS _eas, ISchemaRegistry _schemaRegistry)
        IStatement(_eas, _schemaRegistry, SCHEMA_ABI, IS_REVOCABLE)
    {}

    function makeStatement(StatementData calldata data, uint64 expirationTime, bytes32 refUID)
        public
        returns (bytes32)
    {
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

    // IArbiter implementations

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

    function getSchemaAbi() public pure override returns (string memory) {
        return SCHEMA_ABI;
    }

    function getDemandAbi() public pure override returns (string memory) {
        return DEMAND_ABI;
    }
}

```