## Why EAS?

Barter is back. Fungible currency allowed us to reduce the complexity of trading by always selling for and buying with the same thing, but its adoption is not free. Even in today's highly efficient markets, there is always a cost to exchanging X for Y for Z, over exchanging X for Z directly - usually collected by traders of Y. The cost is non-trivial anywhere Y has poor liquidity or inconvenient means of exchange, including most blockchain programs.

In a barter economy, we want to facilitate the exchange of anything for anything else, since there is no longer a standard "fungible currency" that everything can be exchanged for. The [Ethereum Attestation Service](https://attest.org) is a good option for representing obligation fulfillments in this system, since the [fundamental abstraction](https://docs.attest.org/docs/core--concepts/how-eas-works) of EAS is "A saying X about B", which could be a party making a claim that they've fulfilled an obligation, or a trusted facilitator (e.g. an on-chain contract or an [AVS](https://docs.eigenlayer.xyz/eigenlayer/avs-guides/avs-developer-guide)) making a claim that someone fulfilled an obligation through it.

Many of the abstractions that EAS provides are directly relevant to validated exchange:
- schemas, to have structured [Statements](Components/For_Exchange/Statements.md) and [Validations](Components/For_Exchange/Validations.md)
- referenced attestations
	- a fulfillment offer can reference the offer it fulfills
	- a validation can reference the statement it's about
- expiry/revocation, for time limits and cancelation conditions on deals

## Why Not Tokens?

One way to implement on-chain peer-to-peer exchange would be to rely on the existing infrastructure for token trading, such as DEXs and NFT markets like OpenSea, and to make contracts that create a mechanical association between a token and other underlying assets to be exchanged.

However, this introduces unnecessary overhead compared to using EAS attestations to represent [Statements](Components/For_Exchange/Statements.md), since the creation of an EAS attestation, even according to a new schema, is more lightweight than deploying a new token contract. More importantly, EAS is already designed to represent links between attestations and real-world facts, whereas token standards like ERC-20, ERC-721, ERC-1155, and ERC-6909 are not.

Building out a system of composable and modular interconnected token contracts representing obligations and validations would still require reimplementation of much of the abstraction work that's already handled by EAS, such as relationships between attestations.

It's relatively simple to make [Statements](Components/For_Exchange/Statements.md) that represent token deposits, as demonstrated in [ERC20PaymentStatement](Implementations/Exchange/Statements/ERC20PaymentStatement.md), so token-centric architectures can still be implemented, for example when tokens with existing functions (e.g. NFT-gating or DeFi derivatives) already exist.
## Why Not Specialized Networks?

[Alkahest](Alkahest.md)'s Components [For Exchange](Components/For_Exchange.md) are designed as a public good without a protocol-level governance or fee token. The goal is to enable a truly composable and extensible ecosystem, where new [Statements](Components/For_Exchange/Statements.md) and [Validations](Components/For_Exchange/Validations.md) can be made to connect any existing good or service, whether on-chain or offchain, with or without distributed validation, within an open network for peer-to-peer exchange.

Many existing DePIN protocols require a network-level token for use and participation. This makes composing services across different DePIN networks more difficult, since users must hold a different token (and possibly participate in different token mechanics) for each protocol that they're using.

Also, many protocols use a network-level token to provide network-wide guarantees in [proof of stake](https://en.wikipedia.org/wiki/Proof_of_stake) type systems. This is often very performance inefficient relative to untrusted service provision, and leads to [security bottlenecks](https://docs.eigenlayer.xyz/assets/files/EigenLayer_WhitePaper-88c47923ca0319870c611decd6e562ad.pdf) at the least-staked node of a system.

We envision a much more fragmented ecosystem, where concerns about validity are either local to a deal, in which case security collaterals are also local (and token-agnostic) rather than network-wide, and provision is unencumbered by network-level guarantees, or network validity is secured by large pools like [EigenLayer](https://www.eigenlayer.xyz). 

Special [Statements](Components/For_Exchange/Statements.md) or [Validations](Components/For_Exchange/Validations.md) can and will be developed to guarantee that a service is provided by a token-secured network, but the ecosystem we are facilitating does not require its own network token, since it's more like a community standard than a crypto-economic network.