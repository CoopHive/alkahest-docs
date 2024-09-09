### **Introduction**

CoopHive is pioneering generic marketplaces built on three fundamental primitives: the exchange of bundles of assets, a series of credible commitments, and agent-to-agent negotiation. These primitives serve as the cornerstone for creating a diversity of decentralized marketplaces, including for compute, storage, data, bandwidth, and energy. Understanding the motivation behind these choices and how they were carefully selected is valuable for understanding the evolutionary path CoopHive has taken.


### **Motivation**

The original goal was to design a distributed computing network (DCN) with optimistic verification of compute results, where they are assumed correct unless contested. Based on an improvement of prior research, we settled on a sequence of deals, results, and (optional) mediations on-chain. Each element of the sequence consists of an IPFS CID plus necessary on-chain data, minimizing the amount of data on-chain by having pointers to (almost) arbitrarily large data off-chain.

To accommodate various verifiable computing methods, CoopHive introduced pluggable mediation protocols, allowing participants in the network to select their preferred verification strategies. The protocol’s market-making was initially managed by a solver, which matched job offers with resource availability via an off-chain orderbook. Payments were facilitated through a single ERC20 token.


### **Problems**

While the initial design had its merits, several challenges emerged:

1. **Single Token Limitation:** The reliance on a single ERC20 token for payments proved restrictive, as it hampered adoption by limiting the flexibility of payment options.

2. **Decision-Making Process:** It became unclear how agents would effectively accept or reject deals proposed by the solver, highlighting the need for a more structured decision-making process.

3. **Modular Lifecycle Necessity:** The challenges associated with implementing optimistic verification underscored the need for a more modular job lifecycle, where various types of collateral could be added to any part of the job lifecycle.

To learn more about the motivation and problems, see the [first version of the whitepaper](https://docs.co-ophive.network/coophive/whitepaper), the [documentation on verifiable computing](https://docs.co-ophive.network/research/game-theoretic-verifiable-computing/writings), and the [corresponding codebase](https://github.com/CoopHive/coophive-v1-deprecated).


### **Solutions**

To address these challenges, CoopHive decided to evolve its protocol in the following ways:

- **Expanded Payment Options:** Rather than paying in a single ERC20 token, it made sense to allow paying in any token, to incentivize networks that already have their own tokens to use the protocol. Supporting any ERC20 logically led to supporting any token standard (ERC721, ERC1155, ERC6909), allowed for the representation and exchange of nearly any object or asset, including items from Web2 marketplaces like eBay or Amazon, real-world assets, and even energy credits.

- **Bundles of Assets:** The capability to handle payments in any token standard naturally expanded to include the exchange of bundles of tokens. This improvement unlocks numerous use cases, enabling drawing inspiration from decades of game theory research in the exchange of bundles of assets, which provides further utility to protocol participants.

- **Utility Maximization:** The question of whether to accept or reject a deal was cast in terms of utility maximization, a core concept in game theory. This in turn allowed reframing the problem in terms of traditional scheduling problems and peer-to-peer negotiation, providing a more rational basis for decision-making.

- **Verifiable Computing and Collateralization:** The problem of verifiable computing was also revisited through the lens of utility maximization. Since most verifiable computing strategies require collateral from at least one involved party (at least when computations are being checked by a mediator/validator), this reframing helped position protocol actors as rational, self-interested parties that cheat and/or collude if they believe it would benefit them. After training agents to maximize their utilities, we can then plug in anti-cheating mechanisms in a modular manner to see their impact on individual agents, and the network as a whole.

- **Modular Commitments:** As described above, the need to prevent cheating within the network led to the development of a modular system for making different types of commitments. In this system, collateral is placed in escrow, and depending on the outcome of some process (e.g. a transaction, computation, off-chain oracle, etc.), the collateral may be retained, or released to one of the parties. This approach also integrates well with the exchange of different types and bundles of assets, enabling the modeling of various kinds of marketplaces beyond just computing.

- **Autonomous Agent Interaction:** Since these marketplaces are designed for interaction by autonomous agents, particularly for pricing and scheduling in the computing context, the modular series of credible commitments allows agents to make and enforce commitments to each other (and themselves) programmatically. Agent-to-agent negotiation, a key primitive in multi-agent systems, is facilitated by this structure. From this new perspective, solvers-as-market-makers should emerge organically from scalability needs, rather than imposed on protocol agents from the outset.


### **Conclusion**

This represents one of the first attempts to put these primitives into practice. As it evolves, market feedback will play a crucial role in identifying the strengths and weaknesses of each iteration. By remaining adaptable and responsive to real-world usage, we aim to refine and optimize the protocol, driving the development of generic, machine-actionable marketplaces.
