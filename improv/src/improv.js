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

const StateMachine = compose({
	props:{
		onStateChange: {},
		onStateUpdate: {},
		state: null,
	},
	init({
		inTransition,
		outTransition
	}){
		for (let state in State) {
			this.onStateChange[state] = []
			this.onStateUpdate[state] = []
		}
		this.inTransition = Transition({...inTransition, stateMachine: this})
		this.outTransition = Transition({...outTransition, stateMachine: this})

		this.registerOnChange(State.IN_TRANSITION, this.inTransition.start)
		this.registerOnChange(State.OUT_TRANSITION, this.outTransition.start)
		this.registerUpdater(State.IN_TRANSITION, this.inTransition.update)
		this.registerUpdater(State.OUT_TRANSITION, this.outTransition.update)
	},
	methods: {
		async setState(state) {
			this.state = state
			for (let handler of this.onStateChange[state]) {
				await handler() 
			}
		},
		async transitionTo(unit) {
			await this.setState(State.OUT_TRANSITION)
			await unit.setState(State.IN_TRANSITION)
			Unit.ActiveUnit = unit
			Unit.History.push(unit.scriptPath)
			if (this.onTransition) {
				await this.onTransition()
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
		registerUpdater(state, stateUpdater){
			this.onStateUpdate[state].push(stateUpdater)
		},
		deregisterUpdater(state, stateUpdater){
			this.onStateUpdate.splice(this.onStateUpdate[state].indexOf(stateUpdater), 1)
		},
		registerOnChange(state, onStateChange){
			this.onStateChange[state].push(onStateChange)
		},
		deregisterOnChange(state, onStateChange) {
			this.onStateChange.splice(this.onStateChange[state].indexOf(onStateChange), 1)
		}
	}
})

/**
 * runnables run until their isDone() condition is satisfied (e.g. AWAIT) or stop() is called
 */
const Runnable = compose({
	init({
		isDone,
		stateMachine
	}) {
		this.isDone = isDone
		this.stateMachine = stateMachine ? stateMachine : this
		this.stateMachine.registerUpdater(State.RUN, this.update)
	},
	methods: {
		update() {
			if (!this.isActive) {
				return
			}
			if (this.onUpdate) {
				this.onUpdate()
			}
			if (this.isDone()) {
				this.stop()
			}
		},
		async start() {
			this.isActive = true
			let resolve
			let p = new Promise(resolve => resolve = resolve)
			this.resolver = resolve
			if (this.onStart) {
				await this.onStart()
			}
			return p
		},
		/**
		 * await onStop(), await onDone() *
		 	if it exists and resolve. Otherwse, resolve.
		 */
		async stop() {
			this.isActive = false
			this.stateMachine.deregisterOnChange( State.RUN, this.update)
			if (this.onStop) {
				await this.onStop()
			}
			if (this.onDone) {
				let result = await this.onDone()
				this.resolver(result)
			} else {
				this.resolver(true)
			}
		},
		async pause() {
			this.isActive = false
			if (this.onPause) {
				return await this.onPause()
			}
		},
		async resume() {
			this.isActive = true
			if (this.onResume) {
				return await this.onResume()
			}
		}
	}
})

const Unit = compose(RegisteredType, StateMachine, Runnable, {
	statics: {
		ActiveUnit: null,
		History: []
	},
	props:{
		state: State.PRELOAD
	},
	init(initArgs) {
		let {
			conditionalTransitions,
			scriptPath,
			next
		} = initArgs
		this.scriptPath = scriptPath
		this.script = require(scriptPath)
		this.next = (next && next.type) ? next : this

		if(conditionalTransitions){
			this.conditionalTransitions = conditionalTransitions.map(({
				exp
			}) => ConditionalTransition({
				exp,
				stateMachine: this,
				next: this.next
			}))
		}

		this.registerUpdater( State.RUN, this.conditionalTransitionsUpdater)
		if (this.scriptUpdater && this.scriptUpdater.update){
			this.registerUpdater( State.RUN, this.scriptUpdater.update)
		}
		
	},
	methods: {
		onUpdate(){
			this.scriptUpdater
		},
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
		//IDEA: parallel-unit support can be enabled by using filter() instead of find()
		conditionalTransitionsUpdater() {
			let activeConditionalTransition = this.conditionalTransitions.find(conditionalTransition => conditionalTransition.eval())
			if (activeConditionalTransition) {
				this.transitionTo(activeConditionalTransition.next)
			}
		},
		async onTransition(unit) {
			await Promise.all(this.stop(), unit.start())
		},
		async onStart() {
			await this.setState(State.RUN)
		},
		async onStop(){
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

const Transition = compose(RegisteredType, Runnable, {
	init({
		time
	}) {
		this.timer = Timer({...time, stateMachine: this.stateMachine})
	},
	methods: {
		async onStart() {
			await this.timer.start()
		},
		onUpdate() {
			this.timer.update()
		}
	}
})
exports.Transition = Transition
//RegisteredType.Register('Transition', Transition)

//a prev's thoughts are more reliable than the next's
// but the next's can always be more varied
//a prev's lies are more reliable than their next's
// but the next's can always be more imaginative
//corollary: a prev's mistakes are only more subtle than the next's, but not fewer
//corollary: the master's mistakes are only more subtle than the student's, but not fewer
//operations on units are like little flexible fortune cookie relationships you can apply onto an executable stateMachine
const ConditionalTransition = compose({
	init({
		exp,
		stateMachine,
		next
	}) {
		this.exp = Exp({exp, stateMachine})
		this.eval = this.exp.eval.bind(this.exp)
		this.next = Unit(next)
	}
})
exports.ConditionalTransition = ConditionalTransition
/**
 * conditionalTransitions parsing logic:
 * this.exps = json.conditionalTransitions.reduce((exps, op, idx, conds) => {
 	let exp = Exps.GetOp(op)
 	if (exp) {
 		let initArgs = conds.GetArgs(exps, idx)
 		let expInst = exp.create({
 			op: op,
 			opArgs: opArgs,
 			prev: Object.create(prev)
 		})
 		return [...exps, expInst]
 	}
 	return exps
 }, [])
 */

const Exp = compose({
	init({
		exp,
		stateMachine
	}) {
		this.ops = exp.ops.map( op => Op({...op, stateMachine, exp:this}))
		this.eval = () => ops.find(op => op.eval()) ? true : false
	}
})
exports.Exp = Exp

const Op = compose(RegisteredType, Runnable, {
	init(initArgs) {
		let {
			opArgs,
		} = initArgs
		this.opArgs = opArgs
		this.eval = this.eval.bind(this.stateMachine)
	},
	methods: {
		eval() {
			//isDone defined in ticktype init
			return this.isDone()
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
			this.actionBlock = ActionBlock({actionLines, stateMachine: this})
			this.registerUpdater( State.RUN, this.actionBlock.update)
		}

		this.registerOnChange( State.LOAD, this.onLoad)
		this.registerOnChange( State.START, this.onStart)

		function listFilesWithExt(next, ext) {
			try {
				return glob.sync(`${next}/*.${ext}`)
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

const ActionLine = compose(Runnable, {
	init({
		text,
		time
	}) {
		this.text = text
		this.timer = Timer({time, stateMachine: this.stateMachine})
	},
	methods: {
		async onStart() {
			console.log(this.text)
			await this.timer.start()
		},
		onUpdate(){
			this.timer.update()
		}
	}
})
exports.ActionLine = ActionLine

const ActionBlock = compose(Runnable, {
	init({actionLines}) {
		this.actionLines = actionLines.map(actionLine => ActionLine({actionLine, stateMachine: this.stateMachine}))
	},
	methods: {
		async onStart() {
			this.isActive = true
			for (let actionLine in this.actionLines) {
				this.activeActionLine = await actionLine.start()
			}
		},
		onUpdate() {
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

		this.stateMachine.registerOnChange( State.START, this.onStart)
	},
	methods: {
		onStart() {
			if (!this.selectables && this.conditionalTransitions) {
				this.selectables = this.conditionalTransitions
					.filter(cp => cp.exp.op === opType)
					.map(cp => cp.exp.opArgs.map(arg => Selectable({handle})))
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
		onUpdate() {
			this.timeLeft = this.timeLeft - Time.DeltaTime
		},
		onStart(){
			let onDone
			let p = new Promise(resolve => onDone = resolve)
			this.onDone = onDone
			return p
		},		
		isDone() {
			return this.timeLeft <= 0
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
		onStart(){
			this.timeOffset = Time.Now()
		},
		onStop(){
			this.timeOffset = 0
		},
		onResume(){
			this.timeOffset = Time.Now() + this.timeOffset
		},
		onPause(){
			this.timeOffset = Time.Now() - this.timeOffset
		},
		isDone() {
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
				Unit.ActiveUnit.start()
					.then(() => new Promise(resolve => {
							testUpdater(Unit.ActiveUnit, resolve)
						}))
			}
			return new Promise( resolve => {
				testUpdater(Unit.ActiveUnit, resolve)
			})
			function testUpdater(resolve) {
				setTimeout(function () {
					if(unit){
						unit.update()
						testUpdater(resolve)
					} else {
						resolve(false)
					}
				}, Time.DefaultTickRate)
			}
		}
	}
})
exports.UpdateDriver = UpdateDriver
