# Compute Marketplace

In this section we demonstrate a possible use of **schemes** and **agents** by building a compute marketplace where users' hardware is associated with Agents autonomously negotiating and scheduling compute tasks. 

In this marketplace, each agent embodies a node that can accept or reject compute jobs based on a defined policy. The fundamental structure of the main modules and their interfaces are constrained, but the actual contents of schemes and agents depend on the specificities of the marketplace and user design choices. In this tutorial, we provide an architecture for the internal logic of an agent.

## Market Definition through Agents and Schemes

Following our market definition, agents interact with each other through schemes, following the functional model represented by `(message, context) => message`. 

In this model, an agent receives a message within a certain context and is responsible for responding with a subsequent message updating the negotiation state. In addition to the current scheme state, the context includes, for example, the agent's role (buyer or seller), previous negotiation messages, on-chain states.

In a compute marketplace, in particular, we can imagine a scenario where a resource provider agent (Agent A) offers compute power, and a client agent (Agent B) seeks to utilize that compute power to perform a predefined task:

- Message: Agent B sends a request message, including details like the amount of compute power required, duration constraints, proposed price and validation scheme.

- Context: The context includes Agent A’s local states and global states (see below  for a detailed discussion). It also includes the current state of the negotiation, such as previous offers or counter-offers, and parallel negotiations associated with other client and resource provider agents.

- Response Message: Agent A receives the request message and, combining it with the context according to a specific policy, evaluates whether it can fulfill the request profitably and how: it might send a counter-offer modifying the values in the original message or accept the deal. This evaluation involves both local states and global states.

- Validation and Finalization: If Agent B accepts the offer, it sends an accept message, recording an on-chain `attestation`, triggering Agent A to perform a set of actions, such as recording an on-chain commitment and starting the compute job.

## Sequential Decision-making Primitives

In the implementation of Agents, interacting with the state machine defined by the Scheme, a natural design choice following the usage of Sequential Decision-making Primitives. Given the absence of an explicit model of the system, this perspective overlaps with the field of Multi-Agent Reinforcement Learning (MARL).

Nevertheless, Agents (both clients and resource providers) interact with an Environment receiving and submitting information. While the bulk of observations are about reading the state machine, other observations about both on-chain and off-chain states can be used, generalizing the definition of Environment. In the same way, while the main output of Agents is about updating the state machine, other *writing* tasks exists, enabling agents to interact and modify other aspects of the Environment.

## Local States

The local state for each agent includes its hardware specifications, such as CPU, GPU, and RAM. These states influence the agent’s capacity to accept compute tasks and formulate offers. Profiling tools enable agents to know their local states and inform their policies accordingly.

Every agent hardware specifications may limit the state space size. For example, some IoT actors would only be able to store and act based on on-chain data. For the same reason, some agents may be unable to perform certain tasks. In other words, each agent has different constraints on both their state space and action space.

## Global States

A set of environmental variables may include:

- L1 and L2 tokens price. The dynamics of the protocol, being based on smart contracts and EVM technology, may be driven by the state of the L1 (Ethereum) and L2 protocol. One shallow proxy for this is the point-in-time price of the two protocols. A deeper understanding of the protocol dynamics could inform the modeling of payment token prices forecasting, informing the optimal behaviour of agents in this blockchain-based marketplace, informing in turn the agent policy.

- Gas Fees: because of the need to record the outcome of a negotiation on the blockchain, the point-in-time gas fees of the protocol blockchain is necessary to build policies: the profitability of a job is a function of the (current) transaction costs. Here we refer to the gas fees of the L2 associated with CoopHive; as per prices, the gas fee time series of Ethereum may be relevant in modeling the dynamics of costs for agents recording states on-chain in the interaction with the protocol.

- Electricity costs. This is a space-time dependent variable defining the cost of electricity in the world. Agents, aware of their own location, are interested in measuring the point-in-time field of the cost of electricity to understand the hedge they may have against other potential agents in different locations. This means that agents could have a module solely focused on the modeling, forecasting and uncertainty quantification of electricity prices to enhance the state space.

- On-chain states: the history of credible commitments recorded on chain is a valuable information to inform policies.

## Schemes

A specific instantiation of a scheme, for this marketplace, can look like:

- request: A client agent signals a need for compute resources, specifying some terms.
- offer: A provider agent responds with available resources and counter-terms.
- accept: Agreement to terms, triggering task commencement.
- attestation: Verification that a task has been initiated or completed.
- terminate: Signaling the end of a negotiation, either due to task completion, timeout, or error.

## Schemes-dependent and Agent-dependent Actions

A straightforward example of actions is the verification of a successful on-chain attestation linked in a message and the sequential writing of the following attestation, linked to the first one. In fact, together with a public key necessarily recorded on-chain, agents are associated with a private key used to sign messages as well.

We here stress the possible modularity of such Action, within the Agent Policy; in some marketplaces/schemes definition, these kinds of actions could be responsibility of the schemes' client, for example synchronously checking the successful recording of every on-chain state LinkedIn to any message within the scheme. While this would sacrifice flexibility in terms of agent policy modularity, it would provide a more solid and simplified infrastructure for policy development.

To give an example, upon receiving a message communicating the possibility for a task to start, an agent might want to verify on-chain that the other party has locked the required collateral, before proceeding with task execution. In this case, only once verified, the agent updates the scheme state by writing an `attestation` message, recording the actual commencement of the compute task. In case of missing collateral, a scheme-compatible `collateral_missing` message may be sent instead, warning the client about the pending state of the negotiation.

## Objective

Regardless of the specific marketplace and of the nature of the scheme, agents are continuously spending computational resources in being able to perform Negotiation and Scheduling operations. Particularly in the context of exchanging arbitrary bundles of assets, in doing this Agents have to deal with risk. A trivial example of a source of risk is the volatility of the exchanged tokens with respect to a risk-free asset. Because of this, agents are more similar to portfolio managers than it may seem, given they can lose capital. This can happen because of the inherent risk in the tokens held buy an agent or because of the systematic losses associated with a poorly performing Negotiation strategy. It is therefore natural to assess agents performance (and even guide their training in a data-driven framework) using risk adjusted metrics.

As discussed in [Recent Advances in Reinforcement Learning in Finance](https://arxiv.org/pdf/2112.04553), possible metrics include:

- Cumulative Return;
- Sharpe Ratio;
- Sortino Ratio;
- Differential Sharpe Ratio.
