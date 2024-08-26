## Introduction

In this documentation we conceptualize the high-level design choices of Coophive, with regards to its multi-agent systems, data-driven optimal control, agent-to-agent negotiation and scheduling. It serves as the reference point to define the building blocks of the agent marketplace and its APIs to both on-chain and other off-chain modules of the protocol. When possible, the discussion is kept general, while when necessary the specificities of the exchanged assets (storage, compute) will be introduced.

The framework is nevertheless defined for "validatable, terminable tasks with collateral transfer after validation". In this context, we talk about "stateless" tasks to stress their inner reproducibility (their lack of dependence against client-specific state variables). The presence of agent-based modeling (whose policy is potentially data-driven, tapping into ML/RL), is motivated by the need to orchestrate a decentralized network of agents in a way that leads to competitive pricing/scheduling, from the user perspective. At the same time, the use of blockchain is motivated by the trustless and automatic transfer of collateral after validation.

## The case for Agent-based modeling

The existance of distributed and heterogenous hardwares and the construction of data-driven policies for optimal decision making does not motivate by itself the usage of an agent-based perspective in the modeling of the system. For example, a centralized solver could be implemented to distribute jobs efficiently across the network.

However, one conceptual advantage is that with an agent-based perspective nodes participating in the network keep *agency* over themselves, i.e. they are continuously able to accept or reject jobs, and this capatibility is never delegated to a central entity.

Moreover, an [agent-based perspective](https://www.doynefarmer.com/publications) can be used to relax conventional assumptions in standard models and, in the spirit of [complex systems theory](https://www.econophysix.com/publications), views marco phenomena such as centralized solvers and order books, in our context, as *emerging properties* of the atomic units of behaviour. This perspective has the potential to avoid the suboptimality following the choice of a misspecificed macro model.

### 1 vs N, N vs 1, N vs N

The most generic case to be considered is an N (clients) vs N (resource providers). While in principle there are aspects of the generic case that are not captured by either kind of stacking of more specific cases, it is reasonable to start thinking about the N vs N as a set of more simple cases. 

In the 1 (agent) vs N (static environment of clients), the problem is mainly scheduling/path planning in the space of tasks. This would basically mean ignoring the presence of multiple agents and just ask ourselves how each of them, blind to the presence of their peers, would move in the space of posted jobs to maximize their utility.

In the N (agents) vs 1 dynamic client/job offer, the problem is more purely a negotiation problem.

It is reasonable to assume optimal policies will be characterized by a trade-off between negotiation and scheduling, related to the concept of [Explore-exploit dilemma](https://ml-compiled.readthedocs.io/en/latest/explore_exploit.html).


### Network Robustness

It appears pretty evident that in the setup of Multi-agent training following greedy policies, the system will end up being [more fragile](https://ceur-ws.org/Vol-2156/paper1.pdf). 

This makes it necessary to have an holistic training setup in which the action space of agents is limited (equivalent of policy-making). This may have the consequence of each agent to [behave suboptimally](https://www.linkedin.com/posts/jean-philippe-bouchaud-bb08a15_how-critical-is-brain-criticality-activity-7000544505359654912-ETjz?utm_source=share&utm_medium=member_desktop), but the system may need to tolerate a certain degree of inefficiency in order to gain robustness.

Related works about the chaotic nature of the learning trajectory, make it necessary to willingly develop and implement underfitted policies to avoid ill-posed problem statements:

- https://pubmed.ncbi.nlm.nih.gov/11930020/
- https://pubmed.ncbi.nlm.nih.gov/29559641/
- https://pubmed.ncbi.nlm.nih.gov/23297213/

In this holistic perspective, a deep conceptual separation between the intelligent and strategic layer is necessary. This is a central node interacting with the agents competition pool, making sure agents are able to act and that the [Cyber-Physical System as a whole](https://retis.sssup.it/~nino/publication/eumas17.pdf) is achieving what it needs to achieve: in other terms, in the spirit of complex systems theory, the fitness function of the network is different from the sum of the fitness functions of agents composing it.

This central node can learn general laws of behaviour based on the goals of the overall system and the behaviour of its components.

The system need to be robust against different kind of non-stationarities: agents could disappear, new appear, macro-variable drastically change. How to avoid the overall system of lead to an endogenous crisis triggered by a small variation in its external variables? In other words, how to ensure a small degree of chaoticity/fragility against perturbations?
