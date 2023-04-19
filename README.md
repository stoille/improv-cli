## About the project
improv is a modeling language for making interactive sequences. the improv interpreter translates a high-level specification of an interactive sequence into a production ready run-time simulation. internally, state-charts are used to model agent states and their runtime behavior.

workflow overview: IMP->FS(units,scenes,tbscene,js)->Toolbag->FS->JS->LOAD

### CLI usage
1) To run:
	npm run-script generate-grammar; npm run-script compile; node .

2) To test:
	npm test

## License

Distributed under the BSD License. See `LICENSE.txt` for more information.
