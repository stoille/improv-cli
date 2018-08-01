import {
	Shot,
	Transition,
	Conditional,
	OneShot,
	Await,
	After,
	Select,
	State
} from './improv'

export default Shot({
	props:{
		assets: [],
		anims: {
			manWalk: '',
			manPace: '',
		},
		selectors: {
			man: Selector('MAN', Pos({x:0,y:0,z:0})),
			manCap: Selector('MAN CAP', Pos({x:0,y:0,z:0})),
			manFace: Selector('MAN FACE', Pos({x:0,y:0,z:0})),
			oldBaptistChurchDoor: Selector('OLD BAPTIST CHURCH DOOR', Pos({x:0,y:0,z:0}))
		}
	},
	methods: {
		
		//how are select topics defined?
		//TODO: finish loading code,
		//TODO: finish rest of indexes,
		//TODO: mock tests for running events,
		//TODO: fix parser to generate IL JSON,
		//TODO: improv generator: IL JSON -> JS project files
		//TODO: file watch live compiling
		//IDEA: syntax or hotkey/markup to define targets
		//IDEA: syntax or hotkey/markup to define actions (functions, grammar)
		//IDEA: model conditionals as target-actions whose target is fixed to the control flow of the conditional's parent and action is programmatically defined. Actions can act on parent state (e.g. VISITED, FIRST, AFTER, ONESHOT) or user events (SELECT, TOUCH)
		
		loadAssets: async () => {
			this.state = State.LOAD_ASSETS

			const kentucky = await import(`${ROOT}/scenes/kentucky`)
				.then( asset => asset.loadAsset())
			const oldBaptistChurch = await
			import (`${ROOT}/scenes/kentucky/oldBaptistChurch`)
				.then(asset => asset.loadAsset())
			
			this.state = State.READY
		},
		onFirstUpdate: () => {
			try {
				return require('./onFirstUpdate').bind(this)
			} catch( err ) {
				console.log(err)
				return null
			}
		},
		onUpdate: () => {
			try {
				return require('./onUpdate').bind(this)
			} catch (err) {
				console.log(err)
				return null
			}
		}
	}
})



/**
 * loadConditionals: async () => {
 	this.state = State.LOAD_CONDITIONALS
 	this.conditionals.push(await
 		import ('./1 - SELECT - MAN - ONCE')
 		.then(shot => Conditional({
 			condition: OneShot(shot.id).Select(selectors.man).TimeSpan(5000, 10000),
 			child: shot(),
 			parent: this
 		})))
 	this.conditionals.push(await
 		import ('./2 - SELECT - MAN CAP - AFTER - SELECT - MAN')
 		.then(shot => Conditional({
 			condition: Select(selectors.manCap).After(Select(selectors.man)),
 			child: shot,
 			parent: this
 		})))
 	this.conditionals.push(await
 		import ('./3 - AFTER - SELECT - MAN CAP')
 		.then(shot => Conditional({
 			condition: After(Select(selectors.manCap)),
 			child: shot,
 			parent: this
 		})))
 	this.conditionals.push(await
 		import ('./4 - AFTER - SELECT - OLD BAPTIST CHURCH DOOR')
 		.then(shot => Conditional({
 			condition: After(Select(selectors.oldBaptistChurchDoor)),
 			child: shot,
 			parent: this
 		})))
 	this.holdConditional.push(await
 		import ('./5 - AWAIT - Pickup - KEY - SELECT - MAN CAP')
 		.then(shot => Conditional({
 			condition: Await(Pickup(selectors.key).Select(selectors.manCap)),
 			child: shot,
 			parent: this
 		})))
 },
 */