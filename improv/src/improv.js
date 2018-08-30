/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')
const {
	performance
} = require('perf_hooks')

const DEBUG = true

const Logger = compose({
	statics:{
		log(string){
			console.log(string)
		},
		error(string){
			console.error(string)
		}
	}
})

const RegisteredType = compose({
	statics: {
		TypeDescriptors: {},
		Register(type, typeDef) {
			if (RegisteredType.TypeDescriptors[type] === undefined) {
				RegisteredType.TypeDescriptors[type] = typeDef
			}
		}
	},
	init(initArgs) {
		//return null for deepProps type declarations
		if (isEmptyObject(initArgs)) {
			return null
		}
		let {
			type,
			skipLookup
		} = initArgs
		//all inheritors of RegisteredType must define a type
		this.type = type ? type : this.type

		if (!RegisteredType.TypeDescriptors[this.type]) {
			Logger.error(`Could not find registered type "${type}". Make sure you've called RegisteredType.Register('${type}', {type})`)
		}
		//this constructor should only run once, to instantiate from type field
		if (skipLookup) {
			return this
		}
		//instantiate from type register
		let typeDescriptor = RegisteredType.TypeDescriptors[this.type]
		return typeDescriptor({ ...initArgs, skipLookup: true })

		function isEmptyObject(obj) {
			return Object.keys(obj).length === 0 && obj.constructor === Object
		}
	},
	deepProps: {
		type: undefined
	}
})

/**
 * Updatables run until their isDoneUpdate() condition is satisfied (e.g. AWAIT) or stopUpdate() is called
 */
const Updatable = compose({
	statics: {
		//TODO: investigate id system
		LastId: 0,
		Updatables: {}
	},
	methods: {
		//inheritors to override isDoneUpdate
		isDoneUpdate() {
			return false
		},
		update() {
			if (this._isUpdateSuspended) {
				return
			}
			if (this.onUpdate) {
				this.onUpdate()
			}
			if (this.isDoneUpdate()) {
				this.stopUpdate({
					isDoneUpdate: true
				})
			}
		},
		async startUpdate() {
			if (DEBUG) {
				Logger.log(`========= START - ${this._id} - ${this.type} =========\n${this}\n=========`)
			}
			this._isUpdateSuspended = false
			let resolve
			let awaitCondition = new Promise(r => resolve = r)
			this._resolver = resolve
			return {
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.startUpdate())),
				awaitCondition: awaitCondition,
				onStartUpdate: this.onStartUpdate ? this.onStartUpdate() : false
			}
		},
		async stopUpdate({
			isDoneUpdate,
			resolveArg
		}) {
			if (DEBUG) {
				Logger.log(`========= STOP - ${this._id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = true
			return {
				children: Promise.all(this._childUpdatables.map(updatable => updatable.stopUpdate({
					isDoneUpdate,
					resolveArg
				}))),
				onDoneUpdate: isDoneUpdate && this.onDoneUpdate ? this.onDoneUpdate() : false,
				onStopUpdate: this.onStopUpdate ? this.onStopUpdate({
					isDoneUpdate,
					resolveArg
				}) : false,
				resolve: this._resolver(resolveArg)
			}
		},
		async pauseUpdate() {
			if (DEBUG) {
				Logger.log(`========= PAUSE - ${this._id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = true
			return {
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.pauseUpdate())),
				onPauseUpdate: this.onPauseUpdate ? this.onPauseUpdate() : false
			}
		},
		async resumeUpdate() {
			if (DEBUG) {
				Logger.log(`========= RESUME - ${this._id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = false
			return {
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.resumeUpdate())),
				onResumeUpdate: this.onResumeUpdate ? this.onResumeUpdate() : false
			}
		},
		addChild(updatable) {
			this._childUpdatables.push(updatable)
			return updatable
		},
		addChildren(updatables) {
			for (let updatable of updatables) {
				this._childUpdatables.push(updatable)
			}
			return updatables
		},
		removeChild(updatable) {
			return this._childUpdatables.splice(this._childUpdatables.indexOf(updatable), 1)
		},
		removeChildren(updatables) {
			//remove passed updatables from childupdatables
			this._childUpdatables = this._childUpdatables.filter( u => updatables.find( uu => uu._id === u._id) )
			for (let updatable of updatables) {
				this._childUpdatables.push(updatable)
			}
		}
	},
	init({
		type
	}) {
		Updatable.LastId += 1
		this._id = Updatable.LastId
		Updatable.Updatables[this._id] = this
		this.type = type ? type : this.type
	},
	deepProps: {
		type: 'Updatable',
		_isUpdateSuspended: true,
		_childUpdatables: [], //Updatable()
		_resolver: resolveArg => resolveArg,
		_id: 0
	}
})

const Time = compose({
	statics: {
		DeltaTime: 0,
		Now: () => performance.now(),
		UpdateDeltaTime: () => {
			let timeOfLastUpdate = this.__timeOfLastUpdate ? this.__timeOfLastUpdate : performance.now()
			Time.DeltaTime = (performance.now() - timeOfLastUpdate)
			this.__timeOfLastUpdate = performance.now()
		}
	},
	methods: {
		getTimestamp() {
			return this._time
		},
		toString(){
			return `${Math.round(this._time / 1000 / 60).toString().
				padStart(2, '0')}:${Math.round(this._time / 1000).toString().
					padStart(2, '0')}`
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
	deepProps: {
		type: 'Time',
		_time: 0 //in ms
	},
})
exports.Time = Time

//TODO: consider replacing Time/TimeSpan with more robust time library
const TimeSpan = compose({
	methods: {
		getTimeLengthMilliseconds() {
			return this._end.getTimestamp() - this._start.getTimestamp()
		},
		getStartTime() {
			return this._start
		},
		getEndTime() {
			return this._end
		},
		toString() {
			return `${this._start},${this._end}`
		}
	},
	init({
		start,
		end
	}) {
		this._start = Time(start)
		this._end = Time(end)
	},
	deepProps: {
		type: 'TimeSpan',
		_start: null,//Time(),
		_end: Time()
	}
})
exports.TimeSpan = TimeSpan

const Timer = compose(Updatable, {
	methods: {
		onUpdate() {
			this._timeLeft = this._timeLeft - Time.DeltaTime
		},
		isDoneUpdate() {
			return this._timeLeft <= 0
		},
		getTimeLengthMilliseconds() {
			return this._time
		},
		toString(){
			return this._time.toString()
		}
	},
	init({
		time
	}) {
		this._time = Time(time)
		this._timeLeft = this._time.getTimestamp()
	},
	deepProps: {
		type: 'Timer',
		_time: null,//Time(),
		_timeLeft: 0
	},
})
exports.Timer = Timer

const Op = compose(RegisteredType, Updatable, {
	methods: {
		eval() {
			//to be overriden by user
			return false
		}
	},
	init() {
		//return {...this, ...initArgs}
		//BAD IDEA: allow operator to modify parent state
		//this.scope = scope
	},
	deepProps: {
		type: 'Operation'
	}
})
exports.Op = Op

const Exp = compose(Updatable, {
	methods: {
		isDoneUpdate() {
			//default to true if no ops were supplied
			return this._ops.every(op => op.eval())
		},
		toString(){
			//return all the ops as strings
			let s = this._ops.reduce((s, op) => `${s}${op} - `, ' ')
			//chop off the last char "-"
			return s.slice(0, s.length - 2)
		}
	},
	init(ops) {
		this._ops = ops ? ops.map(initArgs => Op(initArgs)) : this._ops
		this.addChildren(this._ops)
	},
	deepProps: {
		type: 'Expression',
		_ops: [] //Op()
	}
})
exports.Exp = Exp

const Transition = compose(RegisteredType, Updatable, {
	methods: {
		async onStartTransitionUpdate() { /* Inheritor to override */ },
		async onStartUpdate() {
			return {
				//TODO: analyze load strategy on start
				onLoad: await this.load(),
				onStartUpdate: await this.onStartTransitionUpdate()
			}
		},
		async onStopTransitionUpdate() { /* Inheritor to override */ },
		async onStopUpdate({
			isDoneUpdate,
			resolveArg
		}) {
			return {
				onStopUpdate: await this.onStopTransitionUpdate({
					isDoneUpdate,
					resolveArg
				})
			}
		},
		async onPauseTransitionUpdate() { /* Inheritor to override */ },
		async onPauseUpdate() {
			return {
				onPauseUpdate: await this.onPauseTransitionUpdate()
			}
		},
		async onResumeTransitionUpdate() { /* Inheritor to override */ },
		async onResumeUpdate() {
			return {
				onResumeUpdate: await this.onResumeTransitionUpdate()
			}
		},
		onTransitionUpdate() { /* Inheritor to override */ },
		onUpdate() {
			//let interp = this._timer.update()
			//TODO: apply transition over curr and next
			this.onTransitionUpdate()
		},
		/** A transition is "done" when its expression has been satisfied AND:
		 * 1 - the timer is up
		 * 2 - the current updatable stops
		 * 3 - the next updatable starts
		 **/
		isDoneUpdate() {
			return this._expression.isDoneUpdate()
		},
		async onDoneUpdate() {
			this._curr.setState(State.OUT_TRANSITION)
			this._next.setState(State.IN_TRANSITION)
			//TODO: determine whether curr's state is done or should be put into background
			return {
				onStopUpdateCurr: await this._curr.stopUpdate({
					isDoneUpdate: true
				}),
				onStartUpdateNext: await this._next.startUpdate(),
			}
		},
		async load() {
			return this._next.load()
		},
		toString(){
			return `${this._expression ? `${this._expression}` : ''}\n\t${this.type} to: ${this._next.getShotHeading()}, from: ${this._curr.getShotHeading()}\n`
		}
	},
	init({
		exp,
		time,
		curr,
		next
	}) {
		this._curr = curr
		this._next = next

		this._timer = Timer({time})
		this.addChild(this._timer)

		if(exp){
			this._expression = Exp(exp)
			this.addChild(this._expression)
		}
	},
	deepProps: {
		_curr: null,//Updatable(),
		_prev: null,//Updatable(),
		_next: null,//Updatable(),
		_timer: null,//Timer(),
		_expression: null,//Exp(),
		type: 'Transition'
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

const Unit = compose(RegisteredType, Updatable, {
	statics: {
		ActiveUnits: [],
		History: []
	},
	methods: {
		setState(state) {
			this.state = state
		},
		async onStartUpdate() {
			Unit.ActiveUnits.push(this)
			Unit.History.push(this._scriptPath)
			let results = {}

			this.state = State.UPDATE

			if (this.onStartUnitUpdate) {
				results.onStartUnitUpdate = await this.onStartUnitUpdate()
			}

			return results
		},
		async onStopUpdate({
			isDoneUpdate,
			resolveArg
		}) {
			let results = {}
			//remove this unit from active units
			Unit.ActiveUnits.splice(Unit.ActiveUnits.indexOf(this), 1)
			this.state = State.STOP

			if (this.onStopUnitUpdate) {
				results = await this.onStopUnitUpdate({
					isDoneUpdate,
					resolveArg
				})
			}
			return results
		},
		async onPauseUpdate() {
			let results = {}
			this.lastState = this.state
			this.state = State.PAUSE

			if (this.onPauseUnitUpdate) {
				results = await this.onPauseUnitUpdate()
			}
			return results
		},
		async onResumeUpdate() {
			let results = {}
			this.state = this.lastState

			if (this.onResumeUnitUpdate) {
				results = await this.onResumeUnitUpdate()
			}
			return results
		},
		onUpdate() {
			//update scripts
			this.updateScript()

			if (this.onUnitUpdate) {
				this.onUnitUpdate()
			}
		},
		updateScript() {
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
		toStringUnit(){
			return this.transitions.reduce( (s, t, idx) => s += `${idx}) ${t}\n`, '')
		}
	},
	init({
		transitions,
		scriptPath
	}) {
		this._scriptPath = scriptPath
		this._script = require(scriptPath)

		if (transitions) {
			this.transitions = transitions.map(({
				type,
				exp,
				time,
				next
			}) => Transition({
				type,
				time,
				curr: this,
				next: next ? Unit(next) : this,
				exp
			}))

			this.addChildren(this.transitions)
		}
	},
	deepProps: {
		_scriptPath: '',
		_script: {},
		transitions: []
	}
})
exports.Unit = Unit

/**
 * MODELS
 * */

const ActionLine = compose(Updatable, {
	methods: {
		async onStartUpdate() {
			Logger.log(this._text)
		},
		onUpdate() {
			//TODO: animated closed captions
		},
		getRuntime() {
			return this._timer.getTimeLengthMilliseconds()
		},
		isDoneUpdate() {
			return this._timer.isDoneUpdate()
		},
		toString(){
			return `${this._text} - ${this._timer}`
		}
	},
	init({
		text,
		time
	}) {
		this._text = text
		this._timer = Timer({
			time
		})
		this.addChild(this._timer)
	},
	deepProps: {
		_text: '',
		_timer: null,//Timer(),
		type: 'ActionLine'
	}
})
exports.ActionLine = ActionLine

const ActionBlock = compose(Op, {
	methods: {
		getActiveLine() {
			return this._actionLines[this._activeLineIdx]
		},
		getRuntime() {
			return this._actionLines.reduce((totalLength, line) => totalLength + line.getRuntime(), 0)
		},
		advanceToNextLine() {
			++this._activeLineIdx
			return this.getActiveLine()
		},
		onStartUpdate(){
			this.getActiveLine().startUpdate()
		},
		onUpdate() {
			if (this.getActiveLine().isDoneUpdate()) {
				this.removeChild(this.getActiveLine())
				this.addChild(this.advanceToNextLine())
			}
		},
		isDoneUpdate() {
			return this.getActiveLine().isDoneUpdate()
		},
		toString() {
			//convert args to strings
			let actionLines = this._actionLines ? this._actionLines.reduce((s, al) => `${s}${al}`, '') : ''
			//trim last ","
			actionLines = actionLines.slice(0, actionLines.length - 1)
			return `${actionLines}`
		}
	},
	init({
		actionLines
	}) {
		this._actionLines = actionLines.map(actionLine => ActionLine(actionLine))
		this.addChild(this.getActiveLine())

		this._runtime = sumLineRuntimes(this._actionLines)

		function sumLineRuntimes(actionLines) {
			return actionLines.reduce((runLength, line) => runLength + line.getRuntime(), 0)
		}
	},
	deepProps: {
		_actionLines: [], //ActionLine()
		_activeLineIdx: 0,
		_runtime: null,//Time(),
		type: 'ActionBlock'
	}
})
exports.ActionBlock = ActionBlock
RegisteredType.Register('ActionBlock', ActionBlock)


const SceneHeading = compose({
	methods: {
		toString() {
			return `${this._locationType}. ${this._sceneName}, ${this._location} - ${this._timeOfDay}`
		}
	},
	init({
		timeOfDay,
		sceneName,
		location,
		locationType
	}) {
		this._timeOfDay = timeOfDay
		this._sceneName = sceneName
		this._location = location
		this._locationType = locationType
	},
	deepProps: {
		_timeOfDay: '',
		_sceneName: '',
		_location: '',
		_locationType: '',
	}
})
exports.SceneHeading = SceneHeading

const CameraMovement = compose({
	methods: {
		toString() {
			return `${this._movementType} - ${this._timer ? this._timer : ''}`
		}
	},
	init({
		movementType,
		time
	}) {
		this._movementType = movementType
		if(time){
			this._timer = Timer({
				time
			})
		}
	},
	deepProps: {
		_movementType: '', //'EASE_IN',
		_timer: null //Timer()
	}
})
exports.CameraMovement = CameraMovement

const ShotHeading = compose({
	methods: {
		toString() {
			return `${this._cameraType} - ${this._cameraSource ? `${this._cameraSource}, ${this._cameraTarget}` : this._cameraTarget} - ${this._cameraMovement ? `${this._cameraMovement} -` : ''} ${this._timer}`
		}
	},
	init({
		cameraType,
		cameraSource,
		cameraTarget,
		cameraMovement,
		time
	}) {
		this._cameraType = cameraType
		this._cameraSource = cameraSource
		this._cameraTarget = cameraTarget
		this._cameraMovement = CameraMovement(cameraMovement)
		this._timer = Timer({ time })
	},
	deepProps: {
		_cameraType: '',
		_cameraSource: '',
		_cameraTarget: '',
		_cameraMovement: null, //CameraMovement
		_timer: null//Timer()
	}
})
exports.ShotHeading = ShotHeading

//shot as a unit
const Shot = compose(Unit, {
	statics: {
		//TODO: implement these loaders
		ModelLoader: async asset => asset,
		AnimLoader: async asset => asset
	},
	methods: {
		async onStartUnitUpdate() {
			this.setupCamera()
			this.startAnimations()

			Logger.log(this.toString())
		},
		async load() {
			if (this._isLoaded) {
				return
			} else {
				this._isLoaded = true
			}
			this.state = State.LOAD

			//load assets for this unit and its children
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)

			this.state = State.READY

			return {
				done: true
			}

			//create ModelLoader classes
			async function load(/*assets, loader*/) {
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
		async unload() {
			this.state = State.UNLOAD
			//TODO
			this.state = State.DONE
		},
		async onStopUnitUpdate() {
			//TODO: investigate optimizing unloading on stop
			let results = {}
			results.unload = await this.unload()
			return results
		},
		getShotHeading(){
			return this._shotHeading
		},
		toString(){
			return `${this._sceneHeading}\n${this._shotHeading}\n${this.toStringUnit()}`
		}
	},
	//init takes in a json definition
	init({
		sceneHeading,
		shotHeading,
		actionLines
	}) {
		this._sceneHeading = SceneHeading(sceneHeading)
		this._shotHeading = ShotHeading(shotHeading)
		this._actionBlock = ActionBlock({actionLines})
		this.addChild(this._actionBlock)

		let modelsPath = `${this._scriptPath}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this._scriptPath}/anims`
		this.anims = listFilesWithExt(animsPath, '.fbx')

		function listFilesWithExt(next, ext) {
			try {
				return glob.sync(`${next}/*.${ext}`)
			} catch (error) {
				Logger.error(error);

			}
		}
	},
	deepProps: {
		type: 'Shot',
		_isFirstUpdate: true,
		_isLoaded: false,
		_sceneHeading: null,//SceneHeading(),
		_shotHeading: null, //ShotHeading()
		_actionBlock: null, //ActionBlock()
	}
})
exports.Shot = Shot
RegisteredType.Register('Shot', Shot)

/**
 * User Defined Transitions
 */

const Cut = compose(Transition, {
		methods:{
			toString(){
				return `id:${this.id}`
			}
		},
		init() {

		},
		deepProps: {
			type: 'Cut'
		}
})
RegisteredType.Register('Cut', Cut)

//TODO: define FadeIn separate from Cut
const FadeIn = compose(Transition, {
	methods:{
	},
	init() {

	},
	deepProps: {
		type: 'FadeIn'
	}
})
RegisteredType.Register('FadeIn', FadeIn)

/**
 * User Defined Operations
 */

//TODO: finish implementing this
const Select = compose(Op, {
	methods: {
		onTransitionUpdate() {
			//TODO: anchor handle to correct location
		},
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
			return true
		},
		toString() {
			return `SELECT - ${this._handle}`
		}
	},
	init({
		handle,
	}) {
		this._handle = handle
	},
	deepProps: {
		type: 'Select',
		_handle: null //TODO: define a handler type
	},
})
exports.Select = Select
Op.Register('Select', Select)

//TODO: finish implementing this
const OneShot = compose(Op, {
	methods:{
		toString(){
			return 'ONE_SHOT'
		}
	},
	init(transition){
		this._transition = transition
	},
	deepProps:{
		type: 'OneShot',
		_transition: null
	}
})
exports.OneShot = OneShot
Op.Register('OneShot', OneShot)

const TimeWindow = compose(Op, {
	methods: {
		async onStartUpdate() {
			this._timeOffset = Time({
				ms: Time.Now()
			})
		},
		async onStopUpdate() {
			this._timeOffset = Time()
		},
		async onPauseUpdate() {
			this._timeOffset = Time({
				ms: Time.Now() - this._timeOffset.getTimestamp()
			})
		},
		async onResumeUpdate() {
			this._timeOffset = Time({
				ms: Time.Now() + this._timeOffset.getTimestamp()
			})
		},
		eval() {
			let start = this._timeOffset.getTimestamp() + this._timeSpan.getStartTime().getTimestamp()
			let end = this._timeOffset.getTimestamp() + this._timeSpan.getEndTime().getTimestamp()
			return Time.Now() >= start && Time.Now() <= end
		},
		toString() {
			return `${this._timeSpan}`
		}
	},
	init({
		timeSpan
	}) {
		this._timeSpan = TimeSpan(timeSpan)
	},
	deepProps: {
		type: 'TimeWindow',
		_timeSpan: null,//TimeSpan(),
		_timeOffset: null//Time()
	},
})
exports.TimeWindow = TimeWindow
Op.Register('TimeWindow', TimeWindow)

/**
 * Test Drivers
 */
const UpdateDriver = compose({
	statics: {
		DefaultTickRate: 16, //in ms
	},
	methods: {
		//TODO: replace with real updater
		testUpdate() {
			timeoutUpdater()
			let _resolver
			return new Promise(resolve => _resolver = resolve)

			function timeoutUpdater() {
				setTimeout(function () {
					//TODO: drive Time.UpdateDeltaTime() from rendering engine loop
					Time.UpdateDeltaTime()
					Unit.ActiveUnits.forEach(unit => unit.update())
					if (Unit.ActiveUnits.every(unit => unit.isDoneUpdate())) {
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
