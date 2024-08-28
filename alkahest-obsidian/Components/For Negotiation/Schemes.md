TODO

We are interested in keeping schemes syncronous, meaning it’s the client’s responsibility to listening to the attestation transaction being complete before sending the message, and the other party goes to read on chain only after the message is read containing the transaction said to be completed. Schemas contain the documentation that there has to be a level of trust. Schemas can have no trust, but the fact that there is a moment in which you need trust needs to be documented and it’s mandatory. Part of the specification is stressing where the trust is, not specifying the level of trust (for example the specific mediation, here messages are just about the presence of a mediation layer, regarless of the specific implementation and the relationship with the actual real world state).

Schemes entries are reacher than order-book entries. Each scheme defines a dictionary of keys and numeric values.

About trading bundles of tokens, we don’t need to make everything fungible, it’s just that we are exchanging generic attestations (i.e. attestations about different kinds of assets) for any bundle of ERC tokens, fungible (ERC20) or nonfungible (ERC721). Any offer is a linear combination of Attestations and tokens.

In many ways, Schemes are more fundamental than Agents, as modes of behaviour of Agents can exist only in relation to predefined schemes and to the specific set of properties of schemes.

A central piece, in the definition of global, off-chain states of agents is the centralized messaging node, the PubSub. This node contains a set of recorded messages, that every agent can listen to and decide to store locally, to go back to a Markovian framework in informing the policies, if necessary. 

The messaging scheme defines the most important block of the state space, informing negotiations and scheduling, and also defines part of the action space of agents.