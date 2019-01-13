title: improv
description: A modeling language for interactive sequences. The improv interpreter translates the high-level specification of an interactive sequence into a real-time simulation of its execution. Internally, state-charts are used to model the state and behavior of its resulting runtime.

1) To run:
	npm run-script generate-grammar; npm run-script compile; node .

2) To test:
	npm test