**Agents** are the participants in the negotiation games defined by [Schemes](Schemes.md). Generally, they can be characterized by an (effectful) function `(message, context) => message`, where `message` represents a phase of a scheme, and `context` consists of the agent's role (e.g. buyer or seller), the scheme state including previous messages, on-chain state, and any-other scheme-specific contextual information. The agent listens for messages, and replies with a message to advance the scheme state when it's responsible to do so. 

Since schemes correspond with a real-world process (an actual exchange), agents are also responsible for performing the in-world actions that the scheme state is supposed to represent, as well as for independently confirming the veracity of real world state represented by scheme messages from other (untrusted) parties.

## Actions

Agents are not only responsible for sending scheme-conformant messages. The negotiation and scheduling of tasks requires interaction with the Components [For Exchange](../For_Exchange.md), and with the real world. We call this set of interactions **actions**. 

In general, it's the agent's responsibility to execute actions when a scheme specifies that a message represents a real-world state change (e.g. a registered EAS attestation), as well as to verify other agents' messages corresponding to real world states. However, scheme clients could be implemented to perform actions common between many agents participating in a scheme, to lighten the implementation load for agents.

When actions aren't handled by the scheme client, they will still often be packaged in a modular way, when there are many actions in common between different agents of the same role. For ease of use by different agents, wrappers might be necessary for different development contexts (e.g. programming languages), but complex functions could be developed and provided in a common library.
## Policy

The generic interface and scope of agents is in the implementation of *policies*, whose goal is to update the state \( y \) of the state machine (associated with a schema) interacting with a set of \( N \) agents.

\[ \begin{bmatrix} y_{t+1} \\ a_{i, t+1} \end{bmatrix} = f_i(y_t, X_{i, t}, p_{i, t}), \quad \text{for each } i \in \{1, \ldots, N\} \]

Please note the agent-independence of the state \( y \) and the agent-dependence of all the other variables. In particular, we represent with \( a \) all the additional Actions performed by agents, as discussed in the previous section; we represent with \( X \) additional variables used to inform agents actions, with \( p \) a set of parameters defining the inner state of agents' policies and with \( f \) the functional form relating all these variables. 

The dimensions of the state space can be categorized in different ways. One way is distinguishing between both local states (i.e., variables associated with agents themselves) and global information (i.e., global, environmental variables which are not a function of the agent). In this perspective, we can break further break down the policy equation for agent \( i \):

\[ \begin{bmatrix} y_{t+1} \\ a_{i, t+1} \end{bmatrix} = f_i(y_t, X_{i, t}, Z_{i, t}, p_{i, t}), \quad \text{for each } i \in \{1, \ldots, N\} \]

In other terms, we can further break down the state of the system in:

- \( y \), state of the state machine, the same for every agent and associated with schemas;
- \( X \), additional state components of the environment. These components are defined by each agent, and are characterized by variables which are hidden to all the other \( N-1 \) agents in the system. We call the components of \( X \) *local states*.
- \( Z \), additional state components of the environment. While these components are still defined by each agent, they are characterized by variables which are shared by all agents. We call the components of \( Z \) *global states*.

This distinction aligns with the general framework of *partially observable Markov games*, characterizing the protocol.