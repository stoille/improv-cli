/**
 * CORE
 * */
import compose from 'stampit'
import * as glob from 'glob'

const State = {
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

//TODO: replace with more robust time library
const Time = compose({
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
export { Time }
//TODO: replace with more robust time library
const TimeSpan = compose({
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
export { TimeSpan }

var UnitTypesRegister = {}

const Unit = compose({
	statics: {
		RegisterType(type, op) {
			UnitTypesRegister[type] = op
		},
		ActiveUnit: null,
		History: []
	},
	props:{
		state: State.PRELOAD,
		onStateChangeHandlers: {},
		onStateUpdate: {}
	},
	init({
		type,
		inTransition,
		conditionalPaths,
		scriptPath,
		outTransition,
		next
	}) {
		//if type is specified from json definition, instantiate from type register, set the type manually, and return unit
		if(type){
			let unit = UnitTypesRegister[type]({
				inTransition,
				conditionalPaths,
				scriptPath,
				outTransition,
				next
			})
			unit.type = type
			return unit
		}
		this.type = type
		this.inTransition = Transition(inTransition)
		this.conditionalPaths = conditionalPaths.map(({exp, unit, index}) => ConditionalPath({exp, env: this, unit, index}))
		this.scriptPath = scriptPath
		this.script = require(scriptPath)
		this.outTransition = Transition(outTransition)
		this.next = next ? unit.next = next : this
		this.onStateUpdate = {
			'IN_TRANSITION': [this.inTransition.update()],
			'RUN': [() => {
				this.updateConditionalPaths()
				this.updateSequences()
				if (this.state === State.DONE) {
					return
				}
				if (this.script) {
					if (this.isFirstUpdate) {
						this.script.onFirstUpdate()
					} else {
						this.script.onUpdate()
					}
				}
			}],
			'OUT_TRANSITION': [this.outTransition.update()]
		}
		return unit
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
			if (this.state === State.DONE ||
				this.state === State.PAUSE ||
				this.state === State.PRELOAD) {
				return
			}
			let activeConditionalPath = this.conditionalPaths.find(conditionalPath => conditionalPath.eval())
			if (activeConditionalPath) {
				this.transitionTo(activeConditionalPath.unit)
				return
			}
			if (this.state === State.RUN && this.next.eval()) {
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
			this.setState(State.IN_TRANSITION)
			await unit.inTransition.run()
			this.setState(State.RUN)
		},
		async stop(){
			this.setState(State.OUT_TRANSITION)
			await unit.outTransition.run()
		
			this.setState(State.DONE)
			if(this.isReadyToUnload()){
				await this.unload()
			}
		},
		async load() {
			this.setState(State.LOAD)
			await this.loadAssets()
			this.setState(State.READY)
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
export { Unit }

const Transition = compose({
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
export { Transition }

const ConditionalPath = compose({
	init({
		exp,
		env,
		unit
	}) {
		this.exp = Exp({exp, env})
		console.log(this.exp)
		this.eval = this.exp.eval()
		this.unit = Unit(unit)
	}
})
export { ConditionalPath }
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

const Exp = compose({
	init({
		exp,
		env
	}) {
		this.ops = exp.ops.map( op => Op({...op, env}))
		this.eval = this.ops.find(op => !op.eval()) ? false : true
	}
})
export { Exp }

var OpTypesRegister = {}
const Op = compose({
	statics:{
		RegisterType(type, op){
			OpTypesRegister[type] = op
		}
	},
	init({
		type,
		args,
		env
	}) {
		//if type is specified from json definition, instantiate from type register, set the type manually, and return Op
		if(type){
			console.log(OpTypesRegister)
			let op = OpTypesRegister[type]({args, env})
			op.type = type
			return op
		}
		this.type = type
		this.args = args
		this.env = env
		return this
	},
	methods: {
		eval() {
			//to be overriden
		}
	}
})
export { Op }
/**
 * MODELS
 * */

//shot as a unit
const Shot = compose(Unit, {
	props: {
		type: 'Shot',
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
		this.onStateChangeHandlers[State.START].push(() => {
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
					this.setState(State.DONE)
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
export { Shot }
Unit.RegisterType('Shot', Shot)

const SceneHeading = compose({
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
export { SceneHeading }

const ShotHeading = compose({
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
export { ShotHeading }

const ActionLine = compose({
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
export { ActionLine }

const Text = compose({
	init({
		text
	}) {
		this.text = text
	}
})
export { Text }
/**
 * User Defined Operations
 */

const Select = compose(Op, {
	props: {
		type: 'Select'
	},
	init({
		handle,
		env
	}) {
		this.handle = handle
		this.env = env
		initializeSelectables.apply(this, env)

		function initializeSelectables(unit) {
			if (doesUnitHaveSelectables(unit) === false) {
				assignSelectables(unit, this.type)
			}

			this.registerStateUpdater(State.RUN, this.update)

			function doesUnitHaveSelectables(unit) {
				return unit.selectables ? true : false
			}

			function assignSelectables(unit, opType) {
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
		update() {
			//TODO
		}
	}
})
export { Select }
Op.RegisterType('Select', Select)

const OneShot = compose(Select)
export { OneShot }
Op.RegisterType('OneShot', OneShot)