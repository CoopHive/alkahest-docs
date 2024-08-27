In this section we demostrate a possible use of **schemes** and **agents** by building a compute marketplace where users' hardwares are associated with Agents autonomously negotiating and scheduling compute tasks. While the fundamental structure of the main modules, together with their interfaces, is constrained, the actual contents of Schemes and Agents are dependent on the specificities of the marketplace, and the user design choices. In this tutorial we give a possible architecture for the internal logic of an Agent.

## Sequential Decision-making Primitives

In the implementation of Agents, interacting with the state machine defined by the Scheme, a natural design choice following the usage of Sequential Decision-making Primitives. Given the absence of an explicit model of the system, this perspective overlaps with the field of Multi-Agent Reinforcement Learning.

Nevertheless, Agents (both clients and resource providers) interact with an Environment receiving and submitting information. While the bulk of observations are about reading the state machine, other observations about both on-chain and off-chain states can be used, generalizing the definition of Environment. In the same way, while the main output of Agents is about updating the state machine, other *writing* tasks exists, enabling agents to interact and modify other aspects of the Environment.

## Local States

The specifications of the machine (hardware or virtual machine) associated with an agent (in turn, associated with a public key), is an example of Local States. These include:

 * CPU
 * GPU
 * RAM

These information may or may not be recorded on-chain; regadless, profiling enables agent to know their own states and inform their policies with this information.

Every agent hardware specifications may limit the state space size. For example, some IoT actors would only be able to store and act based on on-chain data. For the same reason, some agents may be unable to perform certain tasks. In other words, each agent has different constraints on both their state space and action space.

## Global States

A set of environmental variables may include:

- L1 and L2 tokens price. The dynamics of the protocol, being based on smart contracts and EVM technology, may be driven by the state of the L1 (Ethereum) and L2 protocol. One shallow proxy for this is the point-in-time price of the two protocols. A deeper understanding of the protocol dynamics could inform the modeling of payment token prices forecasting, informing the optimal behaviour of agents in this blockchain-based marketplace, informing in turn the agent policy.

- Gas Fees: because of the need to record the outcome of a negotiation on the blockchain, the point-in-time gas fees of the protocol blockchain is necessary to build policies: the profitability of a job is a function of the (current) transaction costs. Here we refer to the gas fees of the L2 associated with CoopHive; as per prices, the gas fee time series of Ethereum may be relevant in modeling the dynamics of costs for agents recording states on-chain in the interaction with the protocol.

- Electricity costs. This is a space-time dependent variable defining the cost of electricity in the world. Agents, aware of their own location, are interested in measuring the point-in-time field of the cost of electricity to understand the hedge they may have against other potential agents in different locations. This means that agents could have a module solely focused on the modeling, forecasting and uncertainty quantification of electricity prices to enhance the state space.

- On-chain states: the history of credible commitments recorded on chain is a valuable information to inform policies.

## Schemas-dependent and Agent-dependent Actions

A straightforward example of actions is the verification of a successfull on-chain attestation linked in a message and the sequential writing of the following attestation, linked to the first one. In fact, together with a public key necessarily recorded on-chain, agents are associated with a private key used to sign messages as well.

We here stress the possible modularity of such Action, within the Agent Policy; in some marketplaces/schemes definition, these kinds of actions could be responsibility of the schemes' client, for example synchronously checking the successful recording of every on-chain state linkedin to any message within the scheme. While this would sacrify flexibility in terms of agent policy modularity, it would provide a more solid and simplified infrastructure for policy development.
