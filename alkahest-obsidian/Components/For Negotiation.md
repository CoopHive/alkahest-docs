Barter is back. Fungible currency allowed us to reduce the complexity of trading by always selling for and buying with the same thing, but its adoption is not free. Even in today's highly efficient markets, there is always a cost to exchanging X for Y for Z, over exchanging X for Z directly - usually collected by traders of Y. The cost is non-trivial anywhere Y has poor liquidity or inconvenient means of exchange, including most blockchain programs.

In this section we conceptualize the high-level design choices and primitive definitions of the protocol, with regards to its multi-agent systems, potential data-driven optimal control, agent-to-agent negotiation and scheduling. It serves as the reference point to define the building blocks of the schemes and agents marketplace and their APIs to both on-chain and other off-chain modules of the protocol.

The Negotiation framework is defined for validatable, terminable tasks with collateral transfer after validation. In this context, we talk about "stateless" tasks to stress their inner reproducibility (their lack of dependence against client-specific state variables). The presence of agent-based modeling (whose policy is potentially data-driven, tapping into ML/RL), is motivated by the need to orchestrate a decentralized network of agents in a way that leads to competitive pricing/scheduling, from the user perspective. At the same time, the use of blockchain is motivated by the trustless and automatic transfer of collateral after validation.

## Schemes

TODO.

## Agents

The existance of distributed and heterogenous hardwares and the potential construction of data-driven policies for optimal decision making do not motivate by themselves the usage of an agent-based perspective in the modeling of the system.

The case for Agent-based modeling resides in the fact that nodes participating in the network keep *agency* over themselves, i.e. they are continuously able to accept or reject jobs, and this capatibility is never delegated to a central entity.

Moreover, an [agent-based perspective](https://www.doynefarmer.com/publications) can be used to relax conventional assumptions in standard models and, in the spirit of [complex systems theory](https://www.econophysix.com/publications), to view marco phenomena as *emerging properties* of the atomic units of behaviour. This perspective has the potential to avoid the suboptimality following the choice of a misspecificed macro model.

Finally, in the spirit of barter, the line between buy and sell side gets less well defined, beside the actions order in a given negotiation, and it's possible to have every player in the protocol be defined by the same, universal modes of behaviour.