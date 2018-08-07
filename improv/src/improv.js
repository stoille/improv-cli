/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')
const filterCircularRefences = require('./common').filterCircularRefences

const State = {
	PRELOAD: 'PRELOAD',
	LOAD: 'LOAD',
	READY: 'READY',
	START: 'START',
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
exports.Time = Time
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
exports.TimeSpan = TimeSpan

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
		onStateUpdateHandlers: {}
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
		this.scriptPath = scriptPath
		this.script = require(scriptPath)
		this.outTransition = Transition(outTransition)
		this.next = next === 'this' ? this : next
		//initialize state handlers
		for(let state in State){
			this.onStateChangeHandlers[state] = []
			this.onStateUpdateHandlers[state] = []
		}
		
		this.onStateUpdateHandlers[State.IN_TRANSITION] = [this.inTransition.update()]
		this.onStateUpdateHandlers[State.RUN] = [() => {
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
		}]
		this.onStateUpdateHandlers[State.OUT_TRANSITION] = [this.outTransition.update()]
		
		this.conditionalPaths = conditionalPaths.map(({exp, unit, index}) => ConditionalPath({exp, env: this, unit, index}))

	},
	methods: {
		update() {
			let onStateUpdateHandlers = this.onStateUpdateHandlers[this.state]
			if(onStateUpdateHandlers) {
				onStateUpdateHandlers.forEach(update => update())
			}
		},
		registerStateUpdater(state, updaterFunc){
			this.onStateUpdateHandlers[state].push(updaterFunc)
		},
		deregisterStateUpdater(state, updaterFunc){
			this.onStateUpdateHandlers.splice(this.onStateUpdateHandlers[state].indexOf(updaterFunc), 1)
		},
		registerStateChangeHandler(state, updaterFunc){
			if (!this.onStateChangeHandlers[state]) {
				this.onStateChangeHandlers[state] = []
			}
			this.onStateChangeHandlers[state].push(updaterFunc)
		},
		deregisterStateChangeHandler(unit, state, updaterFunc) {
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
exports.Unit = Unit

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
			if (this.onUpdate){
				this.onUpdate()
			}

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
exports.Transition = Transition

const ConditionalPath = compose({
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
exports.ConditionalPath = ConditionalPath
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
		this.eval = () => this.ops.find(op => !op.eval()) ? false : true
	}
})
exports.Exp = Exp

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
exports.Op = Op
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
		console.log(this.onStateChangeHandlers)
		this.onStateChangeHandlers[State.START].push(() => {
			this.setupCamera()
			this.startAnimations()
		})
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		if(actionLines){
			this.actionLines = actionLines.map(actionLine => ActionLine(actionLine))
		}
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
exports.Shot = Shot
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
exports.SceneHeading = SceneHeading

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
exports.ShotHeading = ShotHeading

const ActionLine = compose({
	init({
		text,
		time
	}) {
		this.text = text
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
exports.ActionLine = ActionLine

const Text = compose({
	init({
		text
	}) {
		this.text = text
	}
})
exports.Text = Text
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
		
		if (!env.selectables && env.conditionalPaths) {
			env.selectables = env.conditionalPaths
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

		this.env.registerStateUpdater(State.RUN, this.update)
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
exports.Select = Select
Op.RegisterType('Select', Select)

const OneShot = compose(Select)
exports.OneShot = OneShot
Op.RegisterType('OneShot', OneShot)