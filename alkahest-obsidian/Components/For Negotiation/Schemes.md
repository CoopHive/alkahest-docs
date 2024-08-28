A **scheme** is a definition of a negotiation game in which [[Agents]] notify each other of their intents and actions via a sequence of messages. Schemes are defined according to a set of typed messages communicated via [pubsub](https://en.wikipedia.org/wiki/Publish–subscribe_pattern) channels, and a set of rules that define
- what messages are valid (either mandatory or optional) responses from what kinds of agents, under what contexts
- what real-world (i.e. out-of-band) state particular messages represent, and what kinds of checks are available to agents to verify messages that represent out-of-band facts
- what messages are available to what agents under what contexts, and guidelines for what messages agents should be interested in, and when they should start/stop listening to particular topics
- what conditions represent termination of a negotiation

Schemes can be thought of as all the information that agents in a negotiation game have access to, other than the information they get from local observations. Relatedly, they also represent all the universally shared state within a negotiation other than on-chain state and other publicly accessible real-world state.

## Messages


## Topics

## Rules
