TODO ABOVE ME

As also discussed in the following section, Agents are not merely responsible for reading the state associated with the given scheme, but also of performing more generic calculations/verifications. These interactions with generic environmental variables, including separate components of the protocol, are potentially responsible for contributing to the state update policy.

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

This distinction alligns with the general framework of *Partially observable Markov Games*, characterizing the protocol.