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
	IN_TRANSITION: 'IN_TRANSITION',
	UPDATE: 'UPDATE',
	BACKGROUND: 'BACKGROUND',
	PAUSE: 'PAUSE',
	OUT_TRANSITION: 'OUT_TRANSITION',
	STOP: 'STOP',
	UNLOAD: 'UNLOAD'
}
exports.State = State

const TypeDescriptors = {}
const RegisteredType = compose({
	statics: {
		Register(type, typeDef) {
			if(TypeDescriptors[type] === undefined){
				TypeDescriptors[type] = typeDef
			}
		}
	},
	init(initArgs) {
		let {
			type,
			skipLookup
		} = initArgs
		if(type){
			this.type = type
		}
		if (!TypeDescriptors[this.type]){
			console.error(`Could not find registered type "${type}". Make sure you've called RegisteredType.Register('${type}', {type})`)
		}
		//this constructor should only run once, to instantiate from type field
		if(skipLookup){
			return this
		}
		//instantiate from type register
		let typeDescriptor = TypeDescriptors[this.type]
		return typeDescriptor({...initArgs, skipLookup: true})
	}
})

/**
 * Awaitables run until their isDone() condition is satisfied (e.g. AWAIT) or stop() is called
 */
const Awaitable = compose({
	init({
		isDone,
		stateMachine
	}) {
		stateMachine = stateMachine ? stateMachine
			: this.stateMachine ? this.stateMachine : this
		stateMachine.registerUpdater(State.IN_TRANSITION, this.update.bind(this))
		stateMachine.registerUpdater(State.UPDATE, this.update.bind(this))
		stateMachine.registerUpdater(State.OUT_TRANSITION, this.update.bind(this))
		this.isDone = isDone
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
				this.results.onStart = await this.onStart()
			}
			return p
		},
		/**
		 * await onStop(), await onDone() *
		 	if it exists and resolve. Otherwse, resolve.
		 */
		async stop() {
			this.isActive = false
			if (this.onStop) {
				this.results.onStop = await this.onStop()
			}
			if (this.onDone) {
				this.results.onDoneResult = await this.onDone()
			}
			this.resolver(this.results)
			return this.results
		},
		async pause() {
			this.isActive = false
			if (this.onPause) {
				this.results.onPauseResult = await this.onPause()
			}
			return this.results
		},
		async resume() {
			this.isActive = true
			if (this.onResume) {
				this.results.onResume = await this.onResume()
			}
			return this.results
		},
		async onTransition(unit) {
			await Promise.all(this.stop(), unit.start())
		},
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

//TODO: finish implementing this
const Timer = compose(Awaitable, {
	props: {
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
		onStart() {
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

const Transition = compose(RegisteredType, Awaitable, {
	init(initArgs) {
		let {
			time,
			stateMachine
		} = initArgs
		this.timer = Timer({ time, stateMachine})
	},
	methods: {
		async onStart() {
			await this.timer.start()
		},
		async onUpdate() {
			//this.timer.update()
			//TODO: tick the transition
		}
	}
})
exports.Transition = Transition
//RegisteredType.Register('Transition', Transition)

/**
 * transitions parsing logic:
 * this.exps = json.transitions.reduce((exps, op, idx, conds) => {
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
	},
	methods: {
		async setState(state) {
			this.state = state
			this.results.onStateChangeHandler = {}
			for (let onStateChangeHandler of this.onStateChange[state]) {
				this.results.onStateChangeHandler[state] = await onStateChangeHandler(state) 
			}
			return Promise.resolve(this.results)
		},
		update() {
			let stateUpdaters = this.onStateUpdate[this.state]
			for (let updater of stateUpdaters) {
				updater()
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

const Loadable = compose(StateMachine, {
	init() {
		this.results = {}
	},
	methods: {
		async load() {
			await this.setState(State.LOAD)
			if (this.onLoad) {
				this.results.onLoad = await this.onLoad()
			}
			await this.setState(State.READY)
		},
		async unload() {
			await this.setState(State.UNLOAD)
			if (this.unLoad) {
				this.results.unLoad = await this.unLoad()
			}
		}
	}
})

//a prev's thoughts are more reliable than the next's
// but the next's can always be more constied
//a prev's lies are more reliable than their next's
// but the next's can always be more imaginative
//corollary: a prev's mistakes are only more subtle than the next's, but not fewer
//corollary: the master's mistakes are only more subtle than the student's, but not fewer
//operations on units are like little flexible fortune cookie relationships you can apply onto an executable stateMachine
const ConditionalTransition = compose({
	init({
		exp,
		next
	}) {
		this.eval = this.exp.eval.bind(exp)
		this.next = next
	}
})
exports.ConditionalTransition = ConditionalTransition

const Unit = compose(RegisteredType, StateMachine, Awaitable, Loadable, {
	statics: {
		ActiveUnit: null,
		History: []
	},
	props:{
		state: State.PRELOAD
	},
	init(initArgs) {
		let {
			transitions,
			scriptPath,
			next
		} = initArgs
		this.scriptPath = scriptPath
		this.script = require(scriptPath)
		this.next = (next && next.type) ? next : this

		if(transitions){
			this.transitions = transitions.map(({
				exp
			}) => ConditionalTransition({
				exp,
				next: Unit(this.next)
			}))
		}

		this.registerUpdater(State.UPDATE, this.update.bind(this))
	},
	methods: {
		async onStart(){
			this.results.inTransitionStart = await this.inTransition.start()
			this.results.onStart = await this.setState(State.IN_TRANSITION)
			return Promise.resolve(this.results)
		},
		async onStop(){
			this.results.inTransitionStart = await this.inTransition.start()
			this.results.onStop = await this.setState(State.STOP)
			return Promise.resolve(this.results)
		},
		async transitionTo(unit) {
			this.results.onStop = await this.stop()
			this.results.transitionTo = await unit.start()
			if (this.onTransition) {
				this.results.onTransition = await this.onTransition(unit)
			}
			return Promise.resolve(this.results)
		},
		onUpdate(){
			this.updateConditionalTransitions()
			this.updateScript()
		},
		updateScript(){
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
		updateConditionalTransitions() {
			let activeConditionalTransition = this.transitions.find(transition => transition.eval())
			if (activeConditionalTransition) {
				this.transitionTo(activeConditionalTransition.next)
			}
		},
		async onTransition(unit){
			Unit.ActiveUnit = unit
			Unit.History.push(unit.scriptPath)
			return Promise.resolve(true)
		}
	}
})
exports.Unit = Unit

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

const Op = compose(RegisteredType, Awaitable, {
	init(initArgs) {
		let {
			opArgs
		} = initArgs
		this.opArgs = opArgs
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
			this.registerUpdater(State.UPDATE, this.actionBlock.update.bind(this.actionBlock))
		}
		this.registerOnChange(State.IN_TRANSITION, this.onShotStart.bind(this))
		this.registerOnChange(State.OUT_TRANSITION, this.onShotStop.bind(this))
		this.registerOnChange(State.LOAD, this.onLoad.bind(this))

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
		async onShotStart(){
			this.setupCamera()
			this.startAnimations()
			this.results.onActionBlockStart = await this.actionBlock.start()
			return await this.stop()
		},
		async onShotStop(){
			this.results.onTransitionTo = await this.transitionTo(this.next)
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

const ActionLine = compose(Awaitable, {
	init({
		text,
		time,
		stateMachine
	}) {
		this.text = text
		this.timer = Timer({time, stateMachine})
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

const ActionBlock = compose(Awaitable, {
	init({
		actionLines,
		stateMachine
	}) {
		this.actionLines = actionLines.map(actionLine => ActionLine({
			actionLine,
			stateMachine
		}))
	},
	methods: {
		async onStart() {
			this.isActive = true
			for (let actionLine of this.actionLines) {
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
		handle,
	}) {
		this.handle = handle
	},
	methods: {
		async onStart() {
			if (!this.selectables && this.transitions) {
				this.selectables = this.transitions
					.filter(cp => cp.exp.op === opType)
					.map(cp => cp.exp.opArgs.map(arg => Selectable({handle})))
					.reduce((flatten, array) => [...flatten, ...array], [])
					.reduce((sels, sel) => {
						sels[sel.handle] = sel
						return sels
					}, {})
			}
			return this.Promise(this.results)
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
		//TODO: replace with real updater
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
