/**
 * CORE
 * */
import { compose } from 'stampit'
import * as glob from 'glob'

//TODO: restructure units using this definition
export const Unit = compose({
	init({
		type,
		inTransition,
		conditionalPaths,
		scriptPath,
		next,
		outTransition,
		next
	}) {
		let unit = (type && Unit.TypesRegister[type]) ?
				Object.create(Unit.TypesRegister[type]) :
				this
		Unit.TypesRegister[type] = unit
		unit.type = type
		unit.inTransition = Transition(inTransition)
		unit.conditionalPaths = conditionalPaths.map(({exp, unit, index}) => ConditionalPath({exp, env: this, unit, index}))
		//scriptPath supplied by parser
		unit.scriptPath = scriptPath
		unit.script = require(scriptPath)
		unit.outTransition = Transition(outTransition)
		unit.next = next ? unit.next = next : this
		return unit
	},
	statics: {
		Types: {},
		ActiveUnit: null,
		History: [],
		State: {
			PRELOAD: 'PRELOAD',
			LOAD: 'LOAD',
			READY: 'READY',
			IN_TRANSITION: 'IN_TRANSITION',
			RUN: 'RUN',
			BACKGROUND: 'BACKGROUND',
			PAUSE: 'PAUSE',
			OUT_TRANSITION: 'OUT_TRANSITION',
			DONE: 'DONE',
			UNLOAD: 'UNLOAD'
		}
	},
	props:{
		state: Unit.State.PRELOAD,
		onStateChangeHandlers: {},
		onStateUpdate: {
			'IN_TRANSITION': [this.inTransition.update()],
			'RUN': [() => {
				this.updateConditionalPaths()
				this.updateSequences()
				if (this.state === Unit.State.DONE) {
					return
				}
				if (this.script){
					if (this.isFirstUpdate) {
						this.script.onFirstUpdate()
					} else {
						this.script.onUpdate()
					}
				}
			}],
			'OUT_TRANSITION': [this.outTransition.update()]
		}
	},
	methods: {
		update() {
			let onStateUpdate = this.onStateUpdate[this.state]
			if(onStateUpdate) {
				onStateUpdate.forEach(update => update())
			}
		},
		registerStateUpdater(unit, state, updaterFunc){
			this.onStateUpdate[state].push(updaterFunc)
		},
		deregisterStateUpdater(unit, state, updaterFunc){
			this.onStateUpdate.splice(this.onStateUpdate[state].indexOf(updaterFunc), 1)
		},
		registerStateChangeHandler(unit, state, onStateChange){
			if (!unit.onStateChangeHandlers[state]) {
				unit.onStateChangeHandlers[state] = []
			}
			unit.onStateChangeHandlers[state].push(updaterFunc)
		},
		deregisterStateChangeHandler(unit, state, onStateChange) {
			unit.onStateChangeHandlers.splice(unit.onStateChangeHandlers[state].indexOf(updaterFunc), 1)
		},
		updateConditionalPaths() {
			if (this.state === Unit.State.DONE ||
				this.state === Unit.State.PAUSE ||
				this.state === Unit.State.PRELOAD) {
				return
			}
			let activeConditionalPath = this.conditionalPaths.find(conditionalPath => conditionalPath.eval())
			if (activeConditionalPath) {
				this.transitionTo(activeConditionalPath.unit)
				return
			}
			if (this.state === Unit.State.RUN && this.next.eval()) {
				this.transitionTo(this.next)
				return
			}
		},
		async transitionTo(unit) {
			this.stop()
			Unit.ActiveUnit = unit
			Unit.History.push(unit.scriptPath)
			await unit.start()
		},
		setState(state){
			this.onStateChangeHandlers[state].forEach(stateChangeHandler => stateChangeHandler)
		},
		async start() {
			this.setState(Unit.State.IN_TRANSITION)
			await unit.inTransition.run()
			this.setState(Unit.State.RUN)
		},
		async stop(){
			this.setState(Unit.State.OUT_TRANSITION)
			await unit.outTransition.run()
		
			this.setState(Unit.State.DONE)
			if(this.isReadyToUnload()){
				await this.unload()
			}
		},
		async load() {
			this.setState(Unit.State.LOAD)
			await this.loadAssets()
			this.setState(Unit.State.READY)
		},
		async loadAssts(){
			//to be overridden
		},
		isReadyToUnload(){
			//to be overriden
		},
		async unload(){
			await this.unloadAssets()
		}
	}
})

export const Transition = compose({
	methods: {
		run() {
			this.time = this.transitionTime
			this.runPromise = new Promise()
			return this.runPromise
		},
		update() {
			if(this.isDone()){
				return
			}
			this.time -= Time.deltaTime
			
			//TODO: tick screen transitions here
			this.onUpdate()

			if (this.isDone()) {
				this.runPromise.resolve(this.unload)
			}
		},
		isDone(){
			return this.time <= 0
		},
		unload(){
			//TODO
		}
	},
	init({
		transitionTime
	}) {
		this.transitionTime = TimeSpan(transitionTime)
	}
})

export const ConditionalPath = compose({
	init({
		exp,
		env,
		unit
	}) {
		this.exp = Exp({exp, env})
		this.eval = this.exp.eval()
		this.unit = Unit(unit)
	}
})
/**
 * conditionalPaths parsing logic:
 * this.exps = json.conditionalPaths.reduce((exps, op, idx, conds) => {
 	let exp = Exps.GetOp(op)
 	if (exp) {
 		let args = conds.GetArgs(exps, idx)
 		let expInst = exp.create({
 			op: op,
 			args: args,
 			env: Object.create(parent)
 		})
 		return [...exps, expInst]
 	}
 	return exps
 }, [])
 */

export const Exp = compose({
	init({
		exp,
		env
	}) {
		this.ops = exp.map( op => Op({...op, env}))
		this.eval = this.ops.find(op => !op.eval()) ? false : true
	}
})

const Op = compose({
	statics:{
		Types: []
	},
	init({
		type,
		args,
		env
	}) {
		//TODO: NEXT Fix type registration and initialization
		let op = Op.TypesRegister[type]
			? Object.create(Op.TypesRegister[type])
			: this
		Op.TypesRegister[type] = op
		op.type = type
		op.args = args
		op.env = env
		return op
	},
	methods: {
		eval() {
			//to be overriden
		}
	}
})

/**
 * MODELS
 * */

//shot as a unit
export const Shot = compose(Unit, {
	props: {
		isFirstUpdate: true,
		time: TimeSpan({start: Time(), end: Time()}),
		actionLineIndex: 0
	},

	//init takes in a json definition
	init({
		sceneHeading,
		shotHeading,
		actionLines
	}) {
		this.onStateChangeHandlers[Unit.State.START].push(() => {
			this.setupCamera()
			this.startAnimations()
		})
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.actionLines = actionLines.map(actionLine => ActionLine(actionLine))
		let modelsPath = `${this.scriptPath}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this.scriptPath}/anims`
		this.anims = listFilesWithExt(animsPath, '.fbx')

		function listFilesWithExt(path, ext) {
			return glob.sync(`${path}/*.${ext}`)
		}
	},
	statics: {
		//TODO: implement these loaders
		ModelLoader: async (asset) => {},
		AnimLoader: async (asset) => {}
	},
	methods: {
		async loadAssets() {
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)

			async function load(assets, loader) { 
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
			}
		},
		updateSequences(){
			this.updateActionLines()
		},
		setupCamera() {
				//TODO
		},
		startAnimations() {
			//TODO
		},
		updateActionLines() {
			if (this.activeActionLine.isDone()) {
				this.actionLineIndex += 1
				if (this.actionLineIndex > this.actionLines.length) {
					this.setState(Unit.State.DONE)
					return
				}
				this.activeActionLine.stop()
				this.activeAction = this.actionLines[this.actionLineIndex]
				this.activeActionLine.start()
			}
			this.activeActionLine.update()
		}
	}
})

export const SceneHeading = compose({
	init({
		timeOfDay,
		sceneName,
		sceneLocation
	}) {
		this.timeOfDay = timeOfDay
		this.sceneName = sceneName
		this.sceneLocation = sceneLocation
	}
})

export const ShotHeading = compose({
	init({
		cameraType,
		cameraSource,
		cameraTarget,
		timeSpan
	}) {
		this.cameraType = cameraType
		this.cameraSource = cameraSource
		this.cameraTarget = cameraTarget
		this.timeSpan = TimeSpan(timeSpan)
	}
})

//TODO: replace with more robust time library
export const Time = compose({
	props:{
		min: 0,
		sec: 0,
		ms: 0
	},
	init({
		min,
		sec,
		ms
	}) {
		this.min = min
		this.sec = sec
		if(!ms){
			this.ms = ((min*60) + sec) * 1000
		}
	}
})
//TODO: replace with more robust time library
export const TimeSpan = compose({
	props:{
		start: Time(),
		end: Time()
	},
	init({
		start,
		end
	}) {
		this.start = Time(start)
		this.end = Time(end)
		this.ms = this.end.ms - this.start.ms
	}
})

export const ActionLine = compose({
	init({
		text,
		time
	}) {
		this.text = text.map( txt => Text(txt))
		this.time = TimeSpan(time)
	},
	methods: {
		stop(){
			//TODO
		},
		start(){
			//TODO
		},
		update(){
			//TODO
		},
		isDone(){
			//TODO
		}
	}
})

export const Text = compose({
	init({
		text
	}) {
		this.text = text
	}
})

/**
 * User Defined Operations
 */

export const Select = compose(Op, {
	props: {
		type: 'Select'
	},
	init({
		handle,
		unit
	}) {
		this.handle = handle
		this.unit = unit
		setupUnit(unit)

		function setupUnit(unit) {
			if (doesUnitHaveSelectables(unit) === false) {
				initializeSelectables(unit, this.type)
			}

			//TODO next

			function doesUnitHaveSelectables(unit) {
				return unit.selectables ? true : false
			}

			function initializeSelectables(unit, opType) {
				unit.selectables = unit.conditionalPaths
					.filter(cond => cond.exp.op === opType)
					.map(cond => cond.exp.args.map(arg => Selectable({
						handle
					})))
					.reduce((flatten, array) => [...flatten, ...array], [])
					.reduce((sels, sel) => {
						sels[sel.handle] = sel
						return sels
					}, {})
			}
		}
	},
	methods: {
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
			return true
		},
		onUpdate() {
			//TODO: NEXT: FIX UPDATER LOGIC AND REVALUATE WHETHER IT IS OVERDESIGNED (THINK SO)
			this.selectable.update()
		}
	}
})

let shot = Unit({
	type: 'Shot',
	scriptPath: './kentucky',
	sceneHeading: {
		type: 'SceneHeading',
		timeOfDay: 'NOON',
		sceneName: 'OLD BAPTIST CHURCH',
		sceneLocation: 'KENTUCKY'
	},
	shotHeading: {
		type: 'ShotHeading',
		cameraType: 'Camera.Type.EWS',
		cameraSource: null,
		cameraTarget: 'OLD BAPTIST CHURCH FRONT',
		movement: {type: 'Camera.Movement.Type', start: 0, end: 2},
		timeSpan: TimeSpan({
			start: Time({
				min: 0,
				sec: 00
			}),
			end: Time({
				min: 0,
				sec: 15
			})
		})
	}),
	inTransition: Transition({
		type: 'FadeIn',
		transitionTime: TimeSpan({
			min: 0,
			sec: 3
		})
	}),
	actionLines: [
		ActionLine({
			time: TimeSpan({ 
				min: 0,
				sec: 3
			}),
			text: 'Over the dense hiss and buzz of a humid summer afternoon we see an old man pace along the porch of an old baptist church.'
		}), 
		ActionLine({
			time: TimeSpan({
				min: 0,
				sec: 1
			}),
			text: 'He clears his throat and coughs.'
		}),
	],
	next: ConditionalPath({
		exp: {
			ops: [{
				type: 'Pickup',
				args: [
					Selectable({
						handle: 'KEY',
						pos: new Position(0, 0, 0)
					})
				],
				env: this
			}]
		},
		env: this,
		next: Unit({
			type: 0,
			scriptPath: './kentucky',
			sceneHeading: SceneHeading({
				timeOfDay: 'NOON',
				sceneName: 'OLD BAPTIST CHURCH',
				sceneLocation: 'KENTUCKY'
			}),
			shotHeading: ShotHeading({
				cameraType: Camera.Type.EWS,
				cameraSource: null,
				cameraTarget: 'OLD BAPTIST CHURCH FRONT',
				timeSpan: TimeSpan({
					start: Time({
						min: 0,
						sec: 00
					}),
					end: Time({
						min: 0,
						sec: 15
					})
				})
			}),
			inTransition: Transition({
				type: "Cut"
			}),
			conditionalPaths: [],
			actionLines: [ActionLine({
					time: TimeSpan({
						min: 0,
						sec: 3
					}),
					text: 'Foo.'
				}),
				ActionLine({
					time: TimeSpan({
						min: 0,
						sec: 1
					}),
					text: 'Bar.'
				}),
			],
			next: ConditionalPath({
				exp: Exp({
					op: Op({
						type: 'Pickup',
						args: [
							Selectable({
								handle: 'KEY',
								pos: new Position(0, 0, 0)
							})
						],
						env: this
					})
				}),
				env: this,
				unit: Unit({
					type: 'Shot',
					cameraType,
					cameraSource,
					cameraTarget,
					timeSpan
				}),
				index: 4
			}),
			outTransition: Transition({
				type: "Cut"
			})
		}),
		index: 4
	}),
	outTransition: Transition({
			type: "Cut"
		}),
	conditionalPaths: ConditionalPath({
		
	})
})