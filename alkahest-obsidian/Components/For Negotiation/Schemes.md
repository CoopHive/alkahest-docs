TODO

We are interested in keeping schemes syncronous, meaning it’s the client’s responsibility to listening to the attestation transaction being complete before sending the message, and the other party goes to read on chain only after the message is read containing the transaction said to be completed. Schemas contain the documentation that there has to be a level of trust. Schemas can have no trust, but the fact that there is a moment in which you need trust needs to be documented and it’s mandatory. Part of the specification is stressing where the trust is, not specifying the level of trust (for example the specific mediation, here messages are just about the presence of a mediation layer, regarless of the specific implementation and the relationship with the actual real world state).

## Messaging

A central piece, in the definition of global, off-chain states of agents is the centralized messaging node, the [PubSub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern). This node contains a set of recorded messages, that every agent can listen to (and decide to store locally, to go back to a [Markovian framework](https://en.wikipedia.org/wiki/Markov_decision_process) in informing the policies, if necessary). A question is for example how important it is for agents to observe the negotiation dynamics before an agreement vs learning from final transactions only: this has consequences on the privacy of offers, as it may be valuable to enforce the publicity of intra-negotiation offers for a more transparent auction mechanism. The messaging scheme defines the most important block of the state space, informing negotiations and scheduling, and also defines part of the action space of agents.

## Job

Some examples of a Job Scheme are, for compute (stateless) tasks:
- A docker image and its input(s);
- A github repository and an associated command.

Because we are interested in storage tasks as well, a valuable perspective is decomposing Jobs into modular pieces associated with each other and creating a [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph). This is a natural paradigm for expressing data processing pipelines, machine learning in particular.

 Triggers of modules of purely compute tasks are previous nodes, while for storage tasks sequential nodes are triggered by previous tasks and/or by a clock. In general, it makes sense to think about jobs using the lenses of MLOps and Orchestration, which are focused on the core part of CoopHive: in fact, once the trustless aspect is solved (blockchain), and once the distributed computing is solved (autonomous agents negotiation), we are back to the world of [traditional orchestration](https://www.prefect.io/opensource) of compute and storage tasks. This means there is added value in building things keeping in mind [orchestration compatibilities](https://docs.metaflow.org/metaflow/basics#the-structure-of-metaflow-code).

Here there is no need to explicitly define DAGs. An [agent-based perspective](https://www.prefect.io/controlflow) is maintained within the task framework.

For us, it is more relevant to think about agents when it comes to competition/cooperation when it comes to task allocation and pricing; nevertheless, with a modularization of compute and storage tasks, it is reasonable to keep in mind the agent-based perspective during the task as well. Collateral could be allocated to specific nodes of a DAG and agents to focus on individual modules of a task.