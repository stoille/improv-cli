/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')

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

var TypesRegister = {}
const RegisteredType = compose({
	statics: {
		Register(type, typeDef) {
			TypesRegister[type] = typeDef
		}
	},
	init(initArgs) {
		let {
			type,
			isRegisteredType
		} = initArgs
		//if type is specified from json definition, instantiate from type register, set the type manually, and return unit
		if (!isRegisteredType) {
			return TypesRegister[type]({ ...initArgs, isRegisteredType: true})
		}
		this.type = type
	}
})

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

const Unit = compose(RegisteredType,{
	statics: {
		ActiveUnit: null,
		History: []
	},
	props:{
		state: State.PRELOAD,
		onStateChangeHandlers: {},
		onStateUpdateHandlers: {}
	},
	init(initArgs) {
		let {
			inTransition,
			conditionalPaths,
			scriptPath,
			outTransition,
			next
		} = initArgs
		this.inTransition = Transition(inTransition)
		this.scriptPath = scriptPath
		this.script = require(scriptPath)
		this.outTransition = Transition(outTransition)
		this.next = (next && next.type) ? next : this
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
		
		this.conditionalPaths = conditionalPaths.map(({exp, childUnit}) => ConditionalPath({exp, parentUnit: this, childUnit}))

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
				this.transitionTo(activeConditionalPath.childUnit)
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

const Transition = compose(RegisteredType, {
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
RegisteredType.Register('Transition', Transition)

const ConditionalPath = compose({
	init({
		exp,
		parentUnit,
		childUnit
	}) {
		this.exp = Exp({exp, parentUnit})
		
		this.eval = this.exp.eval()
		this.childUnit = Unit(childUnit)
	}
})
exports.ConditionalPath = ConditionalPath
/**
 * conditionalPaths parsing logic:
 * this.exps = json.conditionalPaths.reduce((exps, op, idx, conds) => {
 	let exp = Exps.GetOp(op)
 	if (exp) {
 		let initArgs = conds.GetArgs(exps, idx)
 		let expInst = exp.create({
 			op: op,
 			opArgs: opArgs,
 			parentUnit: Object.create(parent)
 		})
 		return [...exps, expInst]
 	}
 	return exps
 }, [])
 */

const Exp = compose({
	init({
		exp,
		parentUnit
	}) {
		this.ops = exp.ops.map( op => Op({...op, parentUnit, exp:this}))
		this.eval = () => this.ops.find(op => !op.eval()) ? false : true
	}
})
exports.Exp = Exp

const Op = compose(RegisteredType, {
	init(initArgs) {
		let {
			opArgs,
			parentUnit,
			parentExp
		} = initArgs
		this.opArgs = opArgs
		this.parentUnit = parentUnit
		this.parentExp = parentExp
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
	init(initArgs) {
		let {
			sceneHeading,
			shotHeading,
			actionLines
		} = initArgs
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

		function listFilesWithExt(childUnit, ext) {
			try {
				return glob.sync(`${childUnit}/*.${ext}`)
			} catch (error) {
				console.console.error(error);
				
			}
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
RegisteredType.Register('Shot', Shot)

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
 * User Defined Transitions
 */

 const Cut = compose(Transition,{
	 props: {
		 type: 'Cut'
	 },
	 init({}){

	 }
 })
 RegisteredType.Register('Cut', Cut)

  const FadeIn = compose(Transition,{
	 props: {
		 type: 'FadeIn'
	 },
	 init({}){

	 }
 })
 RegisteredType.Register('FadeIn', FadeIn)

/**
 * User Defined Operations
 */

 //TODO: finish implementing this
const Select = compose(Op, {
	props: {
		type: 'Select'
	},
	init({
		handle
	}) {
		
		this.handle = handle

		const onStart = () => {
			if (!this.parentUnit.selectables && this.parentUnit.conditionalPaths) {
				this.parentUnit.selectables = this.parentUnit.conditionalPaths
					.filter(cond => cond.parentExp.op === opType)
					.map(cond => cond.parentExp.opArgs.map(arg => Selectable({
						handle
					})))
					.reduce((flatten, array) => [...flatten, ...array], [])
					.reduce((sels, sel) => {
						sels[sel.handle] = sel
						return sels
					}, {})
			}
		}
		this.parentUnit.registerStateChangeHandler(State.START, onStart.bind(this))
		this.parentUnit.registerStateUpdater(State.RUN, this.update)
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
Op.Register('Select', Select)

//TODO: finish implementing this
const OneShot = compose(Select)
exports.OneShot = OneShot
Op.Register('OneShot', OneShot)

//TODO: finish implementing this
const TimeWindow = compose(Select)
exports.TimeWindow = TimeWindow
Op.Register('TimeWindow', TimeWindow)