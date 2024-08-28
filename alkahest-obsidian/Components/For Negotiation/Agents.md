**Agents** are the participants in the negotiation games defined by [[Schemes]]. Generally, they can be characterized by an (effectful) function `(message, context) => message`, where `message` represents a phase of a scheme, and `context` consists of the agent's role (e.g. buyer or seller), the scheme state including previous messages, on-chain state, and any-other scheme-specific contextual information. The agent listens for messages, and replies with a message to advance the scheme state when it's responsible to do so. 

Since schemes correspond with a real-world process (an actual exchange), agents are also responsible for performing the in-world actions that the scheme state is supposed to represent, as well as for independently confirming the veracity of real world state represented by scheme messages from other (untrusted) parties.

## Actions

Agents are not only responsible for the autonomous interaction with schemes. As it turns out, negotiation and scheduling of tasks requires a potential modular interaction with the Components for exchange of the protocol. We call this set of interactions **Actions**. In general, it is therefore the Agent's responsibility to both interact with each other via schemes and with the protocol. 

Nevertheless, specific applications of these primitives may enable a more structured integration of actions within schemes, delegating to the scheme client all the agent-independent actions.

## Policy

The generic interface and scope of agents is in the implementation of *policies*, whose goal is to update the state $y$ of the state machine (associated with a schema) interacting with a set of $N$ agents.

$$
\begin{bmatrix}
y_{t+1} \\
a_{i, t+1}
\end{bmatrix}
= f_i(y_t, X_{i, t}, p_{i, t}), \quad \text{for each } i \in \{1, \ldots, N\}
$$

Please note the agent-independence of the state $y$ and the agent-dependence of all the other variables. In particular, we represent with $a$ all the additional Actions performed by agents, as discussed in the previous section; we represent with $X$ additional variables used to inform agents actions, with $p$ a set of parameters defining the inner state of agents' policies and with $f$ the functional form relating all these variables. 

The dimensions of the state space can be categorized in different ways. One way is distinguishing between both local states (i.e., variables associated with agents themselves) and global information (i.e., global, environmental variables which are not a function of the agent). In this perspective, we can break further break down the policy equation for agent $i$:

$$
\begin{bmatrix}
y_{t+1} \\
a_{i, t+1}
\end{bmatrix}
= f_i(y_t, X_{i, t}, Z_{i, t}, p_{i, t}), \quad \text{for each } i \in \{1, \ldots, N\}
$$

In other terms, we can further break down the state of the system in:

- $y$, state of the state machine, the same for every agent and associated with schemas;
- $X$, additional state components of the environment. These components are defined by each agent, and are characterized by variables which are hidden to all the other $N-1$ agents in the system. We call the components of $X$ *Local States*.
- $Z$, additional state components of the environment. While these components are still defined by each agent, they are characterized by variables which are shared by all agents. We call the components of $Z$ *Global States*.

This distinction aligns with the general framework of *partially observable Markov games*, characterizing the protocol.