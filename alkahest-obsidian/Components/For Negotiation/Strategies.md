## State Space

Autonomous Agents are associated with policies why are defined in conjunction with a state space. The dimensions of such state space can be categorized in different ways. One way is distinguishing between both local states (i.e., variables associated with agents themselves) and global information (i.e., global, environmental variables which are not a function of the agent). Another categorization is distinguishing between off-chain and on-chain states.

### Global States

A set of environmental variables appearing necessary for actors to construct optimal policies include:

- L1 and L2 tokens price. We believe the dynamics of the protocol, being based on smart contracts and EVM technology, to be driven by the state of the L1 (Ethereum) and L2 protocol. One shallow proxy for this is the point-in-time price of the two protocols. A deeper understanding of the protocol dynamics could inform the modeling of payment token prices forecasting, informing the optimal behaviour of agents in this blockchain-based marketplace.

- Gas Fees: because of the need to record the outcome of a negotiation on the blockchain, the point-in-time gas fees of the protocol blockchain is necessary to build policies. This is akin to a time-dependent transaciton cost model in trad-fi: the profitability of a position is a function of the (current) transaction costs. Here we refer to the gas fees of the L2 associated with CoopHive; as per prices, the gas fee time series of Ethereum may be relevant in modeling the dynamics of costs for agents recording states on-chain in the interaction with the protocol.

- Electricity costs. This is a space-time dependent variable defining the cost of electricity in the world. Agents, aware of their own location, are interested in measuring the point-in-time field of the cost of electricity to understand the hedge they may have against other potential agents in different locations. This means that agents may have a module solely focused on the [modeling, forecasting and uncertainty quantification](https://arxiv.org/abs/2106.06033) of electricity prices to enhance the state space and then use that as an input for the optimal controller.

- On-chain states: the history of credible commitments recorded on chain is a valuable information to inform policies. While agents cannot be forced to share their local states on chain, one solution could be to enable an emergent secondary marketplace of jobs specifications, in which machines can associate (and this can be verified) their hardware specifications to a given job. The market is emergent as if agents want to become autonomous and this dataset is valuable, they will create it. An important point, on this, is that an agent looking at a given open job is in principle not able to say exactly its computational cost. It can learn from past data only if they are associated with specific schemas that enable the agent to interpolate the input space of the task for that schema (in the presence of enough datapoints to approximate the cost function).

### Local States

The specifications of the machine (hardware or virtual machine) associated with an agent (in turn, associated with a public key), include:

 * CPU
 * GPU
 * RAM

These information may or may not be recorded on-chain; regadless, profiling enables agent to know their own states and inform their policies with this information.

Together with a public key necessarily recorded on-chain, agents are associated with a private key used to sign messages as well.

Every agent hardware specifications may limit the state space size. For example, some IoT actors would only be able to remember and act based on on-chain data, while others may be able to have a bigger memory and bigger state space. For the same reason, some agents may be unable to perform certain tasks (that may be costly and limited by time, in fact the validation could also check constraints in the tasks, like the time it took to complete.). In other words, each agent has different constraints on both their state space and action space.

A task shall be associated with a variable specifying the possibility for it to be distributed. It could also specify the specific/maximum/minimum number of agents to take the task. The minimum case is to enforce federate learning in the case in which sensitive data needs to be broken down. This creates a negotiation with some kind of waiting room in which people can subscribe to participate and can opt-out before the room is full. From the resource provider side, the federate learning scenario could also motivate the introduction of a *Swarm* abstraction, combining different agents that decide to cooperate to a certain degree, for example sharing their state space or their policies.
