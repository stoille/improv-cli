/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')

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
			if (this.isUpdateSuspended) {
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
			this.isUpdateSuspended = false
			let resolve
			let awaitCondition = new Promise(r => resolve = r)
			this.resolver = resolve
			return { 
				awaitCondition: awaitCondition,
				onStartUpdate: this.onStartUpdate ? this.onStartUpdate() : false
			}
		},
		async stopUpdate({isDoneUpdate, resolveArg}) {
			this.isUpdateSuspended = true
			return {
				onDoneUpdate: isDoneUpdate && this.onDoneUpdate ? this.onDoneUpdate() : false,
				onStopUpdate: this.onStopUpdate ? this.onStopUpdate() : false,
				resolve: this.resolver(resolveArg)
			}
		},
		async pauseUpdate() {
			this.isUpdateSuspended = true
			return {
				onPauseUpdate: this.onPauseUpdate ? this.onPauseUpdate() : false
			}
		},
		async resumeUpdate() {
			this.isUpdateSuspended = false
			return {
				onResumeUpdate: this.onResumeUpdate ? this.onResumeUpdate() : false
			}
		}
	},
	props: {
		isUpdateSuspended: true,
		resolver: (resolveArg) => {}
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
	methods: {
		getMinutes() {
			return this._time.getMinutes()
		},
		getSeconds() {
			return this._time.getSeconds()
		},
		getMilliseconds(){
			return this._time.getMilliseconds()
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
		this._time = new Date(0, 0, 0, 0, min, sec, ms)
	},
	props: {
		time: new Date()
	},
})
exports.Time = Time

//TODO: consider replacing Time/TimeSpan with more robust time library
const TimeSpan = compose({
	methods:{
		getRunLength() {
			return this._time
		}
	},
	init({
		start,
		end
	}) {
		this._start = Time(start ? start : {})
		this._end = Time(end ? end : {})
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
		getRunLength(){
			return this._time
		}
	},
	init({
		time
	}) {
		this._time = Time(time)
		this._timeLeft = this._time.getMilliseconds()
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
			return true
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
		onupdate() {
			if(alwaysTrue){
				return
			}
			this.operations.forEach(op => op.update())
		},
		isDoneUpdate() {
			//default to true if no ops were supplied
			return this.operations ? this.operations.find(op => op.eval()) : true
		}
	},
	init({
		ops
	}) {
		this.operations = ops ? ops.map(opArgs => Op(opArgs)) : null
	},
	props: {
		operations: []
	}
})
exports.Exp = Exp
//TODO: NEXT find infinite loop onStartUpdate
const Transition = compose(RegisteredType, Awaitable, {
	methods: {
		async onStartTransitionUpdate() { /* Inheritor to override */ },
		async onStartUpdate(){
			return {
				onStartUpdateExp: await this._expression.startUpdate(),
				awaitExp: this._expression.awaitCondition,
				onStartUpdate: await this.onStartUpdate()
			}
		},
		async onStopTransitionUpdate() { /* Inheritor to override */ },
		async onStopUpdate() {
			return {
				onStopUpdateTimer: this._timer.stopUpdate(),
				onStopUpdateExp: this._expression.stopUpdate(),
				onStopUpdate: await this.onStopUpdate()
			}
		},
		async onPauseTransitionUpdate() { /* Inheritor to override */ },
		async onPauseUpdate() {
			return {
				onPauseUpdateTimer: this._timer.pauseUpdate(),
				onPauseUpdateExp: this._expression.pauseUpdate(),
				onPauseUpdate: await this.onPauseUpdate()
			}
		},
		async onResumeTransitionUpdate() { /* Inheritor to override */ },
		async onResumeUpdate() {
			return {
				onResumeUpdateTimer: this._timer.resumeUpdate(),
				onResumeUpdateExp: this._expression.resumeUpdate(),
				onResumeUpdate: await this.onResumeUpdate()
			}
		},
		onTransitionUpdate() { /* Inheritor to override */ },
		onUpdate() {
			this._expression.update()
			
			//let interp = this._timer.update()
			//TODO: apply transition over curr and next
			this.onUpdate()
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
				onStopUpdateCurr: await this._curr.stopUpdate(),
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
		History: []
	},
	methods: {
		setState( state ){
			this.state = state
		},
		async onStartUpdate(){
			Unit.ActiveUnits.push(this)
			Unit.History.push(this.scriptPath)
			let results = {}
			//wait until all transitions start
			results.onStartUpdateTransitions = await Promise.all(this.transitions.map( t => t.startUpdate()))
	
			this.state = State.UPDATE

			if(this.onStartUnitUpdate){
				results.onStartUnitUpdate = await this.onStartUnitUpdate()
			}
			
			return results
		},
		async onStopUpdate(){
			let results = {}
			//wait until all transitions start
			results.onStopUpdateTransitions = await Promise.all(this.transitions.map(t => t.onStopUpdate()))
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
			results.onPauseUpdateTransitions = await Promise.all(this.transitions.map(t => t.onPauseUpdate()))

			this.lastState = this.state
			this.state = State.PAUSE

			if (this.onPauseUnitUpdate) {
				results = await this.onPauseUnitUpdate()
			}
		},
		async onResumeUpdate() {
			let results = {}
			//wait until all transitions start
			results.onResumeUpdateTransitions = await Promise.all(this.transitions.map(t => t.onResumeUpdate()))

			this.state = this.lastState

			if (this.onResumeUnitUpdate) {
				results = await this.onResumeUnitUpdate()
			}
		},
		onUpdate(){
			//update transitions
			this.transitions.forEach(t => t.update())
			//update scripts
			this.updateScript()
			
			if(this.onUnitUpdate){
				this.onUnitUpdate()
			}
		},
		updateScript(){
			if (this.script) {
				if (this._isFirstUpdate) {
					this._isFirstUpdate = false
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
	},
	init({
			transitions,
			scriptPath
		}) {
		this.scriptPath = scriptPath
		this.script = require(scriptPath)

		if (transitions) {
			this.transitions = transitions.map(({
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
		scriptPath: '',
		script: {},
		transitions: []
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
 			return this._timer.getRunLength()
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
 		_actionLines: [ActionLine()],
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
			return {
				//TODO: 
				onLoadTransitions: await Promise.all(this.transitions.map(t => t.load())),
			}
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
		let modelsPath = `${this.scriptPath}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this.scriptPath}/anims`
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
		onUpdate(){
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
		async onStartOpUpdate(){
			this._timeOffset = Time.Now()
		},
		async onStopOpUpdate(){
			this._timeOffset = 0
		},
		async onPauseOpUpdate() {
			this._timeOffset = Time.Now() - this._timeOffset
		},
		async onResumeOpUpdate(){
			this._timeOffset = Time.Now() + this._timeOffset
		},
		isDoneUpdate() {
			return Time.Now() >= this.getTimeSpan().getStartUpdate() 
			&& Time.Now() <= this.getTimeSpan().getEnd()
		},
		applyOffset(time){
			return this._timeOffset + time.getMilliseconds()
		},
		getTimeSpan() {
			return this.applyOffset(this._timeSpan)
		}
	},
	init() {
		let timeSpan = this.opArgs[0]
		this._timeSpan = TimeSpan(timeSpan)
	},
	props: {
		type: 'TimeWindow',
		timeSpan: TimeSpan()
	},
})
exports.TimeWindow = TimeWindow
Op.Register('TimeWindow', TimeWindow)

/**
 * Test Drivers
 */
const UpdateDriver = compose({
	methods: {
		//TODO: replace with real updater
		testUpdate() {
			timeoutUpdater()
			let resolver
			return new Promise( resolve => resolver = resolve)

			function timeoutUpdater(){
				setTimeout(function () {
					Unit.ActiveUnits.forEach(unit => unit.update())
					if(Unit.ActiveUnits.every(unit => unit.isDoneUpdate())){
						resolver()
					}
					timeoutUpdater()
				}, Time.DefaultTickRate)
			}
		}
	},
	init({
		unit
	}) {
		Unit.ActiveUnits.push(unit)
		Unit.ActiveUnits.forEach(unit => unit.startUpdate())
	}
})
exports.UpdateDriver = UpdateDriver
