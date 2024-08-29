A **scheme** is a definition of a negotiation game in which [[Agents]] notify each other of their intents and actions via a sequence of messages. Schemes are defined according to a set of typed messages communicated via [pubsub](https://en.wikipedia.org/wiki/Publish–subscribe_pattern) channels, and a set of rules that define:

- what messages are valid (either mandatory or optional) responses from what kinds of agents, under what contexts;
- what real-world (i.e. out-of-band) state particular messages represent, and what kinds of checks are available to agents to verify messages that represent out-of-band facts;
- what messages are available to what agents under what contexts, and guidelines for what messages agents should be interested in, and when they should start/stop listening to particular topics;
- what conditions represent termination of a negotiation.

Schemes can be thought of as all the information that agents in a negotiation game have access to, other than the information they get from local observations. Relatedly, they also represent all the universally shared state within a negotiation other than on-chain state and other publicly accessible real-world state.

## Messages

Messages are the individual phases of a scheme as a state machine, and the public actions of a scheme as a multi-agent game. Generally, messages either represent a claim about agent intent (e.g. an offer in a negotiation), or a notification about out-of-band state, which other interested agents are then responsible for verifying.

A scheme is responsible for defining what messages are part of a negotiation game, what messages agents in particular roles and contexts should be interested in, and what messages agents in particular roles and contexts are allowed or required to send. It also defines what out-of-band state messages are supposed to represent, though it's the responsibility of interested agents to locally validate the correspondence between messages representing out-of-band state and the state they're supposed to represent.
## Topics

Messages are communicated in topics following a pubsub architecture. A scheme defines the organization of messages into topics, and what special kinds of messages indicate interest (subscription) or disinterest (unsubscription) in a particular topic.

Messages within a topic have guaranteed order between agents, while messages across different topics don't. As such, topics often represent independent negotiations within a market where multiple simultaneous negotiations can happen. A series of (scheme-conforming) messages within a topic can be interpreted as a branch of a game tree, or a realization of a Markov game.
## Rules

A scheme is responsible for defining not just a set of typed messages, but a protocol in which they communicate intent and action in a negotiation process. This protocol can be interpreted as a state machine or a multi-agent game. As a state machine, the scheme rules define its complete evolution. As a game, the scheme rules define the valid action space for each agent, conditioned on the scheme state.

Scheme rules can be seen a constraint on the [[Agents]] policy function `(message, context) => message`, defining what messages are valid in response to what messages in what contexts. It's also the scheme's responsibility to describe what out-of-band actions agents are responsible for realizing to maintain the correspondence between the scheme and the real-world process it's intended to represent.