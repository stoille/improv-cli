/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')
const { performance } = require('perf_hooks')

const DEBUG = true

const RegisteredType = compose({
	statics: {
		TypeDescriptors: {},
		Register(type, typeDef) {
			if(RegisteredType.TypeDescriptors[type] === undefined){
				RegisteredType.TypeDescriptors[type] = typeDef
			}
		}
	},
	init(initArgs) {
		//return null for props type declarations
		if (isEmptyObject(initArgs)) {
			return null
		}
		let {
			type,
			skipLookup
		} = initArgs
		//all inheritors of RegisteredType must define a type
		this.type = type ? type : this.type
		
		if (!RegisteredType.TypeDescriptors[this.type]){
			console.error(`Could not find registered type "${type}". Make sure you've called RegisteredType.Register('${type}', {type})`)
		}
		//this constructor should only run once, to instantiate from type field
		if(skipLookup){
			return this
		}
		//instantiate from type register
		let typeDescriptor = RegisteredType.TypeDescriptors[this.type]
		return typeDescriptor({...initArgs, skipLookup: true})

		function isEmptyObject(obj){
			return Object.keys(obj).length === 0 && obj.constructor === Object
		}
	},
	props: {
		type: undefined
	}
})

/**
 * Awaitables run until their isDoneUpdate() condition is satisfied (e.g. AWAIT) or stopUpdate() is called
 */
const Awaitable = compose({
	methods: {
		//inheritors to override isDoneUpdate
		isDoneUpdate(){
			return false
		},
		//TODO: NEXT find out why update() results in an max call stack size exceeded (infinite loop)
		update() {
			if (this._isUpdateSuspended) {
				return
			}
			if (this.onUpdate) {
				this.onUpdate()
			}
			if (this.isDoneUpdate()) {
				this.stopUpdate({isDoneUpdate: true})
			}
		},
		async startUpdate() {
			this._isUpdateSuspended = false
			let resolve
			let awaitCondition = new Promise(r => resolve = r)
			this._resolver = resolve
			return { 
				awaitCondition: awaitCondition,
				onStartUpdate: this.onStartUpdate ? this.onStartUpdate() : false
			}
		},
		async stopUpdate({isDoneUpdate, resolveArg}) {
			this._isUpdateSuspended = true
			return {
				onDoneUpdate: isDoneUpdate && this.onDoneUpdate ? this.onDoneUpdate() : false,
				onStopUpdate: this.onStopUpdate ? this.onStopUpdate({isDoneUpdate, resolveArg}) : false,
				resolve: this._resolver(resolveArg)
			}
		},
		async pauseUpdate() {
			this._isUpdateSuspended = true
			return {
				onPauseUpdate: this.onPauseUpdate ? this.onPauseUpdate() : false
			}
		},
		async resumeUpdate() {
			this._isUpdateSuspended = false
			return {
				onResumeUpdate: this.onResumeUpdate ? this.onResumeUpdate() : false
			}
		}
	},
	props: {
		_isUpdateSuspended: true,
		_resolver: (resolveArg) => {}
	}
})

const Time = compose({
	statics:{
		DeltaTime: 0,
		Now: () => performance.now(),
		UpdateDeltaTime: () => {
			let timeOfLastUpdate = this.__timeOfLastUpdate ? this.__timeOfLastUpdate : performance.now()
			Time.DeltaTime = (performance.now() - timeOfLastUpdate)
			this.__timeOfLastUpdate = performance.now()
		}
	},
	methods: {
		getTimestamp(){
			return this._time
		}
	},
	init({
		min,
		sec,
		ms
	}) {
		min = min ? min : 0
		sec = sec ? sec : 0
		ms = ms ? ms : 0
		this._time = (min * 60 * 1000) + (sec * 1000) + ms
	},
	props: {
		_time: 0 //in ms
	},
})
exports.Time = Time

//TODO: consider replacing Time/TimeSpan with more robust time library
const TimeSpan = compose({
	methods:{
		getTimeLengthMilliseconds() {
			return this._end.getTimestamp() - this._start.getTimestamp()
		},
		getStartTime(){
			return this._start
		},
		getEndTime(){
			return this._end
		}
	},
	init({
		start,
		end
	}) {
		this._start = Time(start)
		this._end = Time(end)
	},
	props: {
		_start: Time(),
		_end: Time()
	}
})
exports.TimeSpan = TimeSpan

//TODO: finish implementing this
const Timer = compose(Awaitable, {
	methods: {
		onUpdate() {
			this._timeLeft = this._timeLeft - Time.DeltaTime
		},
		isDoneUpdate() {
			return this._timeLeft <= 0
		},
		getTimeLengthMilliseconds(){
			return this._time
		}
	},
	init({
		time
	}) {
		this._time = Time(time)
		this._timeLeft = this._time.getTimestamp()
	},
	props: {
		type: 'Timer',
		_time: Time(),
		_timeLeft: 0
	},
})
exports.Timer = Timer

const Op = compose(RegisteredType, Awaitable, {
	methods: {
		eval() {
			//to be overriden by user
			return false
		}
	},
	init({
			opArgs
		}) {
		this.opArgs = opArgs
		//BAD IDEA: allow operator to modify parent state
		//this.scope = scope
	},
	props:{
		opArgs: []
	}
})
exports.Op = Op

const Exp = compose(Awaitable, {
	methods: {
		onStartUpdate(){
			this._ops.forEach(op => op.startUpdate())
		},
		onStopUpdate({isDoneUpdate, resolveArg}) {
			this._ops.forEach(op => op.stopUpdate({isDoneUpdate, resolveArg}))
		},
		onPauseUpdate() {
			this._ops.forEach(op => op.pauseUpdate())
		},
		onResumeUpdate() {
			this._ops.forEach(op => op.resumeUpdate())
		},
		onUpdate() {
			this._ops.forEach(op => op.update())
		},
		isDoneUpdate() {
			//default to true if no ops were supplied
			return this._ops.every(op => op.eval())
		}
	},
	init({
		ops
	}) {
		this._ops = ops ? ops.map(opArgs => Op(opArgs)) : this._ops
	},
	props: {
		_ops: [] //Op()
	}
})
exports.Exp = Exp
const Transition = compose(RegisteredType, Awaitable, {
	methods: {
		async onStartTransitionUpdate() { /* Inheritor to override */ },
		async onStartUpdate(){
			return {
				//TODO: analyze load strategy on start
				onLoad: await this.load(),
				onStartUpdate: await this.onStartTransitionUpdate(),
				onStartUpdateExp: await this._expression.startUpdate(),
			}
		},
		async onStopTransitionUpdate() { /* Inheritor to override */ },
		async onStopUpdate({isDoneUpdate, resolveArg}) {
			return {
				onStopUpdateTimer: this._timer.stopUpdate({isDoneUpdate, resolveArg}),
				onStopUpdateExp: this._expression.stopUpdate({isDoneUpdate, resolveArg}),
				onStopUpdate: await this.onStopTransitionUpdate({isDoneUpdate, resolveArg})
			}
		},
		async onPauseTransitionUpdate() { /* Inheritor to override */ },
		async onPauseUpdate() {
			return {
				onPauseUpdateTimer: this._timer.pauseUpdate(),
				onPauseUpdateExp: this._expression.pauseUpdate(),
				onPauseUpdate: await this.onPauseTransitionUpdate()
			}
		},
		async onResumeTransitionUpdate() { /* Inheritor to override */ },
		async onResumeUpdate() {
			return {
				onResumeUpdateTimer: this._timer.resumeUpdate(),
				onResumeUpdateExp: this._expression.resumeUpdate(),
				onResumeUpdate: await this.onResumeTransitionUpdate()
			}
		},
		onTransitionUpdate() { /* Inheritor to override */ },
		onUpdate() {
			this._expression.update()
			
			//let interp = this._timer.update()
			//TODO: apply transition over curr and next
			this.onTransitionUpdate()
		},
		/** A transition is "done" when its expression has been satisfied AND:
		 * 1 - the timer is up
		 * 2 - the current awaitable stops
		 * 3 - the next awaitable starts
		 **/
		isDoneUpdate(){
			return this._expression.isDoneUpdate()
		},
		async onDoneUpdate(){
			this._curr.setState( State.OUT_TRANSITION )
			this._next.setState(State.IN_TRANSITION )
			//TODO: determine whether curr's state is done or should be put into background
			return {
				onDoneUpdateTimer: await this._timer.startUpdate(),
				onStopUpdateCurr: await this._curr.stopUpdate({isDoneUpdate:true}),
				onStartUpdateNext: await this._next.startUpdate(),
			}
		},
		async load(){
			return this._next.load()
		}
	},
	init({
		exp,
		timer,
		curr,
		next
	}) {
		this._curr = curr
		this._next = next
		this._timer = timer
		this._expression = exp
	},
	props: {
		_curr: Awaitable(),
		_prev: Awaitable(),
		_next: Awaitable(),
		_timer: Timer(),
		_expression: Exp()
	}
})
exports.Transition = Transition

/**
 * transitions parsing logic:
 * this.exps = json.transitions.reduce((exps, op, idx, conds) => {
 	let exp = Exps.GetOp(op)
 	if (exp) {
 		let initArgs = conds.GetArgs(exps, idx)
 		let expInst = exp.create({
 			op: op,
 			opArgs: opArgs,
 			curr: Object.create(curr)
 		})
 		return [...exps, expInst]
 	}
 	return exps
 }, [])
 */

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
 	UNLOAD: 'UNLOAD',
 	DONE: 'DONE'
 }
 exports.State = State

const Unit = compose(RegisteredType, Awaitable, {
	statics: {
		ActiveUnits: [],
		History: [],
		//TODO: investigate id system
		LastId: 0
	},
	methods: {
		setState( state ){
			this.state = state
		},
		async onStartUpdate(){
			Unit.ActiveUnits.push(this)
			Unit.History.push(this._scriptPath)
			let results = {}
			//wait until all transitions start
			results.onStartUpdateTransitions = await Promise.all(this._transitions.map( t => t.startUpdate()))
			
			this.state = State.UPDATE

			if(this.onStartUnitUpdate){
				results.onStartUnitUpdate = await this.onStartUnitUpdate()
			}
			
			return results
		},
		async onStopUpdate({isDoneUpdate, resolveArg}){
			let results = {}
			//wait until all transitions start
			results.onStopUpdateTransitions = await Promise.all(this._transitions.map(t => t.onStopUpdate({isDoneUpdate, resolveArg})))
			//remove this unit from active units
			Unit.ActiveUnits.splice(Unit.ActiveUnits.indexOf(this), 1)
			this.state = State.STOP

			if (this.onStopUnitUpdate) {
				results = await this.onStopUnitUpdate()
			}
		},
		async onPauseUpdate() {
			let results = {}
			//wait until all transitions start
			results.onPauseUpdateTransitions = await Promise.all(this._transitions.map(t => t.onPauseUpdate()))

			this.lastState = this.state
			this.state = State.PAUSE

			if (this.onPauseUnitUpdate) {
				results = await this.onPauseUnitUpdate()
			}
		},
		async onResumeUpdate() {
			let results = {}
			//wait until all transitions start
			results.onResumeUpdateTransitions = await Promise.all(this._transitions.map(t => t.onResumeUpdate()))

			this.state = this.lastState

			if (this.onResumeUnitUpdate) {
				results = await this.onResumeUnitUpdate()
			}
		},
		onUpdate(){
			//update transitions
			this._transitions.forEach(t => t.update())
			//update scripts
			this.updateScript()
			
			if(this.onUnitUpdate){
				this.onUnitUpdate()
			}
		},
		updateScript(){
			if (this._script) {
				if (this._isFirstUpdate) {
					this._isFirstUpdate = false
					if (this._script.onFirstUpdate) {
						this._script.onFirstUpdate()
					}
				} else {
					if (this._script.update) {
						this._script.update()
					}
				}
			}
		},
	},
	init({
			transitions,
			scriptPath
		}) {
		this._id = Unit.LastId++
		
		this._scriptPath = scriptPath
		this._script = require(scriptPath)

		if (transitions) {
			this._transitions = transitions.map(({
						type,
						exp,
						time,
						next
					}) => Transition({
					type,
					timer: Timer({ time }),
					curr: this,
					next: next ? Unit(next) : this,
					exp: Exp(exp)
				})
			)
		}
	},
	props: {
		_scriptPath: '',
		_script: {},
		transitions: [],
		_id: 0
	}
})
exports.Unit = Unit

/**
 * MODELS
 * */

 const Text = compose({
 	init({
 		text
 	}) {
 		this._text = text
 	},
 	props: {
 		_text: ''
 	}
 })
 exports.Text = Text

 const ActionLine = compose(Awaitable, {
 	methods: {
 		async onStartUpdate() {
 			console.log(this._text)
 			return ({
 				onStartUpdateTimer: this._timer.startUpdate()
 			})
 		},
 		onUpdate() {
 			this._timer.update()
 			//TODO: animated closed captions
 		},
 		getRuntime() {
 			return this._timer.getTimeLengthMilliseconds()
		 },
		 isDoneUpdate(){
			 return this._timer.isDoneUpdate()
		 }
 	},
 	init({
 		text,
 		time
 	}) {
 		this._text = Text({
 			text
 		})
 		this._timer = Timer({
 			time
 		})
 	},
 	props: {
 		_text: Text(),
 		_timer: Timer()
 	}
 })
 exports.ActionLine = ActionLine

 const ActionBlock = compose(Op, {
 	methods: {
 		getActiveLine() {
 			return this.actionLines[this._activeLineIdx]
 		},
 		getRuntime() {
			return this.actionLines.reduce((totalLength, line) => totalLength + line.getRuntime(), 0 )
 		},
 		setNextActiveLine() {
 			++this._activeLineIdx
 		},
 		onUpdate() {
 			this.getActiveLine().update()
 			if (this.getActiveLine().isDoneUpdate()) {
 				this.setNextActiveLine()
 			}
 		},
 		isDoneUpdate() {
 			return this.getActiveLine().isDoneUpdate()
 		},
 	},
 	init({
 		actionLines
 	}) {
		 //return null for props type declarations
		if(!actionLines){
			return null
		}
 		this.actionLines = actionLines.map(actionLine => ActionLine({
 			actionLine
 		}))

 		this._runtime = sumLineRuntimes(this._actionLines)

 		function sumLineRuntimes(actionLines) {
 			return actionLines.reduce((runLength, line) => runLength + line.getRuntime(), 0)
 		}
 	},
 	props: {
 		_actionLines: [], //ActionLine()
 		_activeLineIdx: 0,
		 _runtime: Time(),
		 type: 'ActionBlock'
 	}
 })
 exports.ActionBlock = ActionBlock
 RegisteredType.Register('ActionBlock', ActionBlock)

//shot as a unit
const Shot = compose(Unit, {	
	statics: {
		//TODO: implement these loaders
		ModelLoader: async (asset) => {},
		AnimLoader: async (asset) => {}
	},
	methods: {
		async onStartUnitUpdate(){
			this.setupCamera()
			this.startAnimations()
		},
		async load() {
			if(this._isLoaded){
				return
			} else {
				this._isLoaded = true
			}
			this.state = State.LOAD
			
			//load assets for this unit and its children
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)

			this.state = State.READY

			return {done: true}

			//create ModelLoader classes
			async function load(assets, loader) { 
				/* TODO: implement this
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
					*/
				return []
			}
		},
		setupCamera() {
				//TODO
		},
		startAnimations() {
			//TODO
		},
		async unload(){
			this.state = State.UNLOAD
			//TODO
			this.state = State.DONE
		},
		async onStopUnitUpdate() {
			//TODO: investigate optimizing unloading on stop
			let results = {}
			results.unload = await this.unload()
			return results
		}
	},
	//init takes in a json definition
	init({
			sceneHeading,
			shotHeading
		}) {
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		let modelsPath = `${this._scriptPath}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this._scriptPath}/anims`
		this.anims = listFilesWithExt(animsPath, '.fbx')

		function listFilesWithExt(next, ext) {
			try {
				return glob.sync(`${next}/*.${ext}`)
			} catch (error) {
				console.console.error(error);

			}
		}
	},
	props: {
		type: 'Shot',
		_isFirstUpdate: true,
		_isLoaded: false
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
		this._timeOfDay = timeOfDay
		this._sceneName = sceneName
		this._sceneLocation = sceneLocation
	},
	props:{
		_timeOfDay: '',
		_sceneName: '',
		_sceneLocation: ''
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
		this._cameraType = cameraType
		this._cameraSource = cameraSource
		this._cameraTarget = cameraTarget
		this._timeSpan = TimeSpan(timeSpan)
	},
	props: {
		_cameraType: '',
		_cameraSource: '',
		_cameraTarget: '',
		_timeSpan: TimeSpan()
	}
})
exports.ShotHeading = ShotHeading

/**
 * User Defined Transitions
 */

 const Cut = compose(Transition,{
	 props: {
		 type: 'Cut'
	 },
	 init(){

	 }
 })
 RegisteredType.Register('Cut', Cut)

 //TODO: define FadeIn separate from Cut
const FadeIn = compose(Cut,{
	props: {
		type: 'FadeIn'
	},
	init(){

	}
 })
 RegisteredType.Register('FadeIn', FadeIn)

/**
 * User Defined Operations
 */

 //TODO: finish implementing this
const Select = compose(Op, {
	methods: {
		onTransitionUpdate(){
			//TODO: anchor handle to correct location
		},
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
			return true
		},
	},
	init({
		handle,
	}) {
		this.handle = handle
	},
	props: {
		type: 'Select',
		handle: null //TODO: define a handler type
	},
})
exports.Select = Select
Op.Register('Select', Select)

//TODO: finish implementing this
const OneShot = compose(Select)
exports.OneShot = OneShot
Op.Register('OneShot', OneShot)

const TimeWindow = compose(Op, {
	methods: {
		async onStartUpdate(){
			this._timeOffset = Time({ms: Time.Now()})
		},
		async onStopUpdate(){
			this._timeOffset = Time()
		},
		async onPauseUpdate() {
			this._timeOffset = Time({ms: Time.Now() - this._timeOffset.getTimestamp()})
		},
		async onResumeUpdate(){
			this._timeOffset = Time({ms: Time.Now() + this._timeOffset.getTimestamp()})
		},
		eval() {
			let start = this._timeOffset.getTimestamp() + this._timeSpan.getStartTime().getTimestamp()
			let end = this._timeOffset.getTimestamp() + this._timeSpan.getEndTime().getTimestamp()
			return Time.Now() >= start && Time.Now() <= end
		}
	},
	init({timeSpan}) {
		this._timeSpan = TimeSpan(timeSpan)
	},
	props: {
		type: 'TimeWindow',
		_timeSpan: TimeSpan(),
		_timeOffset: Time()
	},
})
exports.TimeWindow = TimeWindow
Op.Register('TimeWindow', TimeWindow)

/**
 * Test Drivers
 */
const UpdateDriver = compose({
	statics:{
		DefaultTickRate: 16, //in ms
	},
	methods: {
		//TODO: replace with real updater
		testUpdate() {
			timeoutUpdater()
			let _resolver
			return new Promise( resolve => _resolver = resolve)

			function timeoutUpdater(){
				setTimeout(function () {
					//TODO: drive Time.UpdateDeltaTime() from rendering engine loop
					Time.UpdateDeltaTime()
					Unit.ActiveUnits.forEach(unit => unit.update())
					if(Unit.ActiveUnits.every(unit => unit.isDoneUpdate())){
						_resolver()
					}
					timeoutUpdater()
				}, UpdateDriver.DefaultTickRate)
			}
		}
	},
	init({
		unit
	}) {
		unit.startUpdate()
	}
})
exports.UpdateDriver = UpdateDriver
