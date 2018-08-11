/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')

const DEBUG = true

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
exports.State = State

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
		if(type){
			this.type = type
		}
		//if type is specified from json definition, instantiate from type register, set the type manually, and return unit
		if (!isRegisteredType) {
			return TypesRegister[this.type]({ ...initArgs, isRegisteredType: true})
		}
	}
})
//TODO: drive deltaTime and timeNow from rendering engine loop
const Time = compose({
	statics:{
		DeltaTime: 0,
		TimeOfLastUpdate: 0,
		DefaultTickRate: 16, //in ms
		Now: () => Date.now(),
		Update: () => {
			Time.DeltaTime = Time.Now() - Time.TimeOfLastUpdate
			Time.TimeOfLastUpdate = Time.Now()
		}
	},
	props:{
		time: new Date()
	},
	init({
		min,
		sec,
		ms
	}) {
		min = min ? min : 0
		sec = sec ? sec : 0
		ms = ms ? ms : 0
		this.time = new Date(0, 0, 0, 0, min, sec, ms)
	},
	methods: {
		getMinutes() {
			return this.time.getMinutes()
		},
		getSeconds() {
			return this.time.getSeconds()
		},
		getMilliseconds(){
			return this.time.getMilliseconds()
		}
	}
})
exports.Time = Time

//TODO: consider replacing Time/TimeSpan with more robust time library
const TimeSpan = compose({
	init({
		start,
		end
	}) {
		this.start = Time(start)
		this.end = Time(end)
	}
})
exports.TimeSpan = TimeSpan

const StateHandler = compose({
	props:{
		onStateChange: {},
		onStateUpdate: {},
		state: null
	},
	init(){
		for (let state in State) {
			this.onStateChange[state] = []
			this.onStateUpdate[state] = []
		}
	},
	methods: {
		async setState(state) {
			this.state = state
			for (let handler of this.onStateChange[state]) {
				//TODO: fix it crashing here
				await handler() 
			}
		},
		update() {
			let state = this.state
			if (this.onStateUpdate) {
				this.onStateUpdate[this.state].every( updater => {
					updater()
					return state === this.state
				})
			}
		},
		registerStateUpdater(state, updaterFunc){
			this.onStateUpdate[state].push(updaterFunc)
		},
		deregisterStateUpdater(state, updaterFunc){
			this.onStateUpdate.splice(this.onStateUpdate[state].indexOf(updaterFunc), 1)
		},
		registerOnStateHandler(state, updaterFunc){
			this.onStateChange[state].push(updaterFunc)
		},
		deregisterOnStateHandler(unit, state, updaterFunc) {
			unit.onStateChange.splice(unit.onStateChange[state].indexOf(updaterFunc), 1)
		}
	}
})

const Unit = compose(RegisteredType, StateHandler,{
	statics: {
		ActiveUnit: null,
		History: []
	},
	props:{
		state: State.PRELOAD
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

		this.conditionalPaths = conditionalPaths.map(({
			exp,
			childUnit
		}) => ConditionalPath({
			exp,
			parentUnit: this,
			childUnit
		}))
		
		this.registerOnStateHandler(State.IN_TRANSITION, () => this.inTransition.start())
		this.registerOnStateHandler(State.OUT_TRANSITION, () => this.outTransition.start())

		this.registerStateUpdater(State.IN_TRANSITION, () => this.inTransition.update())
		this.registerStateUpdater(State.RUN, () => this.conditionalPathUpdater())
		this.registerStateUpdater(State.RUN, () => this.scriptUpdater())
		this.registerStateUpdater(State.OUT_TRANSITION, () => this.outTransition.update())
	},
	methods: {
		scriptUpdater(){
			if (this.script) {
				if (this.isFirstUpdate) {
					this.isFirstUpdate = false
					if (this.script.onFirstUpdate) {
						this.script.onFirstUpdate()
					}
				} else {
					if (this.script.update) {
						this.script.update()
					}
				}
			}
		},
		conditionalPathUpdater() {
			let activeConditionalPath = this.conditionalPaths.find(conditionalPath => conditionalPath.eval())
			if (activeConditionalPath) {
				this.transitionTo(activeConditionalPath.childUnit)
				return
			}
		},
		async transitionTo(unit) {
			if(unit === this){
				return
			}
			await this.stop()
			Unit.ActiveUnit = unit
			Unit.History.push(unit.scriptPath)
			await unit.start()
		},
		async start() {
			await this.setState(State.IN_TRANSITION)
			await this.setState(State.RUN)
		},
		async stop(){
			await this.setState(State.OUT_TRANSITION)
			await this.setState(State.DONE)
		},
		async load() {
			await this.setState(State.LOAD)
			await this.setState(State.READY)
		},
		async unload(){
			await this.setState(State.UNLOAD)
		}
	}
})
exports.Unit = Unit

const Transition = compose(RegisteredType, {
	methods: {
		async start() {
			this.isActive = true
			await this.timer.start()
			stop()			
		},
		stop(){
			this.isActive = false
		},
		pause(){
			this.isActive = false
		},
		resume(){
			this.isActive = true
		},
		update() {
			if(!this.isActive){
				return
			}
			this.timer.update()
		}
	},
	init({
		time
	}) {
		this.timer = Timer(time)
	}
})
exports.Transition = Transition
//RegisteredType.Register('Transition', Transition)

const ConditionalPath = compose({
	init({
		exp,
		parentUnit,
		childUnit
	}) {
		this.exp = Exp({exp, parentUnit})
		
		this.eval = this.exp.eval
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
	},
	//init takes in a json definition
	init(initArgs) {
		let {
			sceneHeading,
			shotHeading,
			actionLines
		} = initArgs
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		let modelsPath = `${this.scriptPath}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this.scriptPath}/anims`
		this.anims = listFilesWithExt(animsPath, '.fbx')

		if (actionLines) {
			this.actionBlock = ActionBlock(actionLines)
			this.registerStateUpdater(State.RUN, () => this.actionBlock.update() )
		}

		this.registerOnStateHandler(State.LOAD, () => this.onLoad())
		this.registerOnStateHandler(State.START, () => this.onStart())
		this.registerOnStateHandler(State.RUN, () => this.actionBlock.update())

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
		async onStart(){
			this.setupCamera()
			this.startAnimations()
			await this.actionBlock.start()
			await this.transitionTo(this.next)
		},
		setupCamera() {
				//TODO
		},
		startAnimations() {
			//TODO
		},
		async onLoad() {
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)

			async function load(assets, loader) { 
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
			}
		},
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
	props:{
		isActive: false
	},
	init({
		text,
		time
	}) {
		this.text = text
		this.timer = Timer(time)
	},
	methods: {
		stop(){
			this.isActive = false
		},
		async start() {
			this.isActive = true
			console.log(this.text)
			await this.timer.start()
			stop()
		},
		update(){
			if(!this.isActive){
				return
			}
			this.timer.update()
		}
	}
})
exports.ActionLine = ActionLine

const ActionBlock = compose({
	init(actionLines) {
		this.actionLines = actionLines.map(actionLine => ActionLine(actionLine))
	},
	methods: {
		async start() {
			this.isActive = true
			for (let actionLine in this.actionLines) {
				this.activeActionLine = await actionLine.start()
			}
		},
		update() {
			this.activeActionLine.update()
		}
	}
})
exports.ActionBlock = ActionBlock

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

 //TODO: define FadeIn separate from Cut
const FadeIn = compose(Cut,{
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

		this.parentUnit.registerOnStateHandler(State.START, this.onStart)
	},
	methods: {
		onStart() {
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
		},
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
			return true
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
const Timer = compose(Op, {
	props:{
		type: 'Timer'
	},
	init({
		time
	}) {
		this.time = Time(time)
		this.timeLeft = this.time.getMilliseconds()
	},
	methods: {
		update() {
			if (this.isDone() || !this.isActive) {
				return
			}
			this.timeLeft = this.timeLeft - Time.DeltaTime
			if(isDone()){
				this.stop()
				this.onDone()
			}
		},
		start(){
			this.isActive = true
			let onDone
			let p = new Promise(resolve => onDone = resolve)
			this.onDone = onDone
			return p
		},
		stop(){
			this.isActive = false
		},
		isDone() {
			return this.timeLeft <= 0
		},
		eval(){
			return this.isDone()
		}
	}
})
exports.Timer = Timer
Op.Register('Timer', Timer)

const TimeWindow = compose(Op, {
	props: {
		type: 'TimeWindow'
	},
	init() {
		let timeSpan = this.opArgs[0]
		this.timeSpan = TimeSpan(timeSpan)
	},
	methods: {
		isWindowActive() {
			return Time.Now() >= this.applyOffset(this.timeSpan.start) && Time.Now() <= this.applyOffset(this.timeSpan.end)
		},
		eval() {
			//HACK: should consider how to start this more explicitly?
			if (!this.timeOffset) {
				this.timeOffset = Time.Now()
			}
			return this.isWindowActive()
		},
		applyOffset(time){
			return this.timeOffset + time.getMilliseconds()
		}
	}
})
exports.TimeWindow = TimeWindow
Op.Register('TimeWindow', TimeWindow)

/**
 * Test Drivers
 */
const UpdateDriver = compose({
	init({
		unit
	}) {
		Unit.ActiveUnit = unit
	},
	methods: {
		update() {
			Time.Update()
			Unit.ActiveUnit.update()
		},
		testUpdate() {
			if(!this.isInitialized){
				this.isInitialized = true
				return Unit.ActiveUnit.start()
			}
			return new Promise( resolve => {
				testUpdater(Unit.ActiveUnit, resolve)
			})
			function testUpdater(unit, resolve) {
				setTimeout(function () {
					if(unit){
						unit.update()
						testUpdater(unit, resolve)
					} else {
						resolve(false)
					}
				}, Time.DefaultTickRate)
			}
		}
	}
})
exports.UpdateDriver = UpdateDriver
