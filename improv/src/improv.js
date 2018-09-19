/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')
const {
	performance
} = require('perf_hooks')

const DEBUG = false

function CreateConcreteType(initArgs) {
	let type = exports[initArgs.type]
	return type(initArgs)
}

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

/**
 * Updatables run until their isDone() condition is satisfied or stop() is called
 */
const Updatable = compose({
	statics: {
		//TODO: investigate id system
		LastId: 0,
		Updatables: {}
	},
	methods: {
		//inheritors to override eval()
		isDone() {
			return this.eval()
		},
		eval() {
			return false
		},
		update() {
			if (this._isUpdateSuspended) {
				return
			}

			for( let childUpdatable of this._childUpdatables){
				childUpdatable.update()
			}
			
			if (this.onUpdate) {
				this.onUpdate()
			}
			
			if (this.isDone()) {
				this.stop()
			}
		},
		async start() {
			if (DEBUG) {
				Logger.log(`========= START - ${this.id} - ${this.type} =========\n${this}\n=========`)
			}
			this._isUpdateSuspended = false
			return {
				onStart: this.onStart ? this.onStart() : false,
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.start())),
			}
		},
		async stop(resolveArg) {
			if (DEBUG) {
				Logger.log(`========= STOP - ${this.id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = true
			return {
				onStop: this.onStop ? this.onStop(resolveArg) : false,
				resolve: this._resolver(resolveArg),
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.stop(resolveArg))),
			}
		},
		async pause() {
			if (DEBUG) {
				Logger.log(`========= PAUSE - ${this.id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = true
			return {
				onPause: this.onPause ? this.onPause() : false,
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.pause())),
			}
		},
		async resume() {
			if (DEBUG) {
				Logger.log(`========= RESUME - ${this.id} - ${this.type} =========`)
			}
			this._isUpdateSuspended = false
			return {
				onResume: this.onResume ? this.onResume() : false,
				children: await Promise.all(this._childUpdatables.map(updatable => updatable.resume())),
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
			let idx = this._childUpdatables.findIndex(child => child.id === updatable.id)
			return this._childUpdatables.splice(idx, 1)
		},
		removeChildren(updatables) {
			//remove passed updatables from childupdatables
			this._childUpdatables = this._childUpdatables.filter( u => updatables.find( uu => uu.id !== u.id) )
			for (let updatable of updatables) {
				this._childUpdatables.push(updatable)
			}
		},
		getAwaitCondition(){
			return this._awaitCondition
		},
		toString(){
			return this.children.reduce((str, child) => `${str}${child}`, '')
		}
	},
	init({
		type
	}) {
		Updatable.LastId += 1
		this.id = Updatable.LastId
		Updatable.Updatables[this.id] = this
		this.type = type ? type : this.type
		let resolve
		this._awaitCondition = new Promise(r => resolve = r)
		this._resolver = resolve
	},
	deepProps: {
		type: 'Updatable',
		_isUpdateSuspended: true,
		_childUpdatables: [], //Updatable()
		_resolver: resolveArg => resolveArg,
		_awaitCondition: null,
		id: 0
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
		eval() {
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

const Exp = compose(Updatable, {
	methods: {
		eval(){
			return this._ops.every(op => op.eval())
		},
		toString(){
			//return all the ops as strings
			let s = this._ops.reduce((s, op) => `${s}${op} - `, ' ')
			//chop off the last char "-"
			return s.slice(0, s.length - 2)
		},
		getOps(){
			return this._ops
		}
	},
	init(ops) {
		this._ops = ops ? ops.map(initArgs => CreateConcreteType({...initArgs, exp: this})) : this._ops
		this.addChildren(this._ops)
	},
	deepProps: {
		type: 'Expression',
		_ops: [] //CreateExportedType()
	}
})
exports.Exp = Exp

const State = {
	PRELOAD: 'PRELOAD',
	LOAD: 'LOAD',
	READY: 'READY',
	IN_TRANSITION: 'IN_TRANSITION',
	UPDATE: 'UPDATE',
	PAUSE: 'PAUSE',
	OUT_TRANSITION: 'OUT_TRANSITION',
	STOP: 'STOP',
	UNLOAD: 'UNLOAD',
	DONE: 'DONE'
}
exports.State = State

const Transition = compose(Updatable, {
	methods: {
		async onStartTransition() { /* Inheritor to override */ },
		async startTransition(){
			this._curr.setState(State.OUT_TRANSITION)
			this._next.setState(State.IN_TRANSITION)
			
			return {
				//TODO: analyze load strategy on start
				onNextLoad: await this._next.load(),
				onNextStart: await this._next.start(),
				onStartTransition: await this.onStartTransition(),
				onStopTransition: await this._timer.then(r => this.stopTransition(r))
			}
		},
		async onStart() {
			
		},
		async onStopTransition() { /* Inheritor to override */ },
		async stopTransition(resolveArg) {
			return {
				onCurrStop: await this._curr.stop(resolveArg),
				onNextStart: await this._next.start(),
				onStop: await this.onStopTransition(resolveArg)
			}
		},
		async onPauseTransition() { /* Inheritor to override */ },
		async onPause() {
			return {
				onPause: await this.onPauseTransition()
			}
		},
		async onResumeTransition() { /* Inheritor to override */ },
		async onResume() {
			return {
				onResume: await this.onResumeTransition()
			}
		},
		onTransitionUpdate() {
			/* Inheritor to override  e.g. apply transition over curr and next. */
		},
		onUpdate() {
			if (this._isTransitionStarted === false && this._expression.eval()) {
				this._isTransitionStarted = true
				this.startTransition()
			}
			this.onTransitionUpdate()
		},
		/** A transition is "done" when its expression has been satisfied AND:
		 * 1 - the timer is up
		 * 2 - the current updatable stops
		 * 3 - the next updatable starts
		 **/
		eval() {
			return this._timer.isDone()
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
		_curr: null,//Unit(),
		_prev: null, //Unit(),
		_next: null, //Unit(),
		_timer: null,//Timer(),
		_expression: null,//Exp(),
		_isTransitionStarted: false,
		type: 'Transition'
	}
})
exports.Transition = Transition

/**
 * transition parsing logic:
 * this.exps = json.transition.reduce((exps, op, idx, conds) => {
 	let exp = Exps.CetcreateExportedType(op)
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

const Unit = compose(Updatable, {
	statics: {
		ActiveUnits: [],
		History: []
	},
	methods: {
		setState(state) {
			this.state = state
		},
		async onStart() {
			Unit.ActiveUnits.push(this)
			//TODO: empty history once moving past unit that can't be revisited
			Unit.History.push(this)
			let results = {}

			this.setState(State.UPDATE)

			if (this.onStartUnitUpdate) {
				results.onStartUnitUpdate = await this.onStartUnitUpdate()
			}

			return results
		},
		async onStop(resolveArg) {
			let results = {}
			//remove this unit from active units
			Unit.ActiveUnits.splice(Unit.ActiveUnits.indexOf(this), 1)

			this.setState(State.STOP)

			if (this.onStopUnit) {
				results = await this.onStopUnit(resolveArg)
			}
			return results
		},
		async onPause() {
			let results = {}
			this.lastState = this.state
			this.state = State.PAUSE

			if (this.onPauseUnit) {
				results = await this.onPauseUnit()
			}
			return results
		},
		async onResume() {
			let results = {}
			this.state = this.lastState

			if (this.onResumeUnit) {
				results = await this.onResumeUnit()
			}
			return results
		},
		onUpdate() {
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
		transitionToString(){
			return this.transition.reduce( (s, t, idx) => s += `${idx}) ${t}\n`, '')
		}
	},
	init({
		transitions,
		scriptPath
	}) {
		this._scriptPath = scriptPath
		this._script = require(scriptPath)

		if (transitions) {
			let concreteTransitions = transitions.reduce((t, {type, exp, time, next}) => {
				if(next){
					return [...t, CreateConcreteType({type, time, exp, curr: this, next: CreateConcreteType(next)})]
				} else {
					return t
				}
				
			}, [])
			this.addChildren(concreteTransitions)
		}
	},
	deepProps: {
		_scriptPath: '',
		_script: {},
		transition: []
	}
	})
exports.Unit = Unit

/**
 * MODELS
 * */

const ActionLine = compose(Updatable, {
	methods: {
		async onStart() {
			Logger.log(this._text)
		},
		onUpdate() {
			//TODO: animated closed captions
		},
		getRuntime() {
			return this._timer.getTimeLengthMilliseconds()
		},
		eval() {
			return this._timer.isDone()
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

const ActionBlock = compose(Updatable, {
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
		onStart(){
			//this.getActiveLine().start()
		},
		onUpdate() {
			let activeLine = this.getActiveLine()
			if (activeLine && activeLine.isDone()) {
				this.removeChild(activeLine)
				let nextLine = this.advanceToNextLine()
				if(nextLine){
					this.addChild(nextLine)
				}
			}
		},
		eval() {
			return this._activeLineIdx >= this._actionLines.length
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
		async onStopUnit() {
			//TODO: investigate optimizing unloading on stop
			let results = {}
			results.unload = await this.unload()
			return results
		},
		getShotHeading(){
			return this._shotHeading
		},
		//TODO: NEXT figure out the right way to present options after printing the action block
		toString(){
			return `${this._sceneHeading}\n${this._shotHeading}`
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

		//this.transition
		this._actionBlock = ActionBlock({actionLines})
		this.addChild(this._actionBlock)

		this._actionBlock.getAwaitCondition().then( () => {
			Logger.log(`this works`)
		})

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
exports.Cut = Cut

//TODO: define FadeIn separate from Cut
const FadeIn = compose(Transition, {
	methods:{
	},
	init() {
		this._type = this.type
	},
	deepProps: {
		type: 'FadeIn'
	}
})
exports.FadeIn = FadeIn

/**
 * User Defined Operations
 */

//TODO: finish implementing this
const Select = compose(Updatable, {
	methods: {
		onUpdate() {
			//TODO: anchor handle to correct location
		},
		eval() {
			//TODO: NEXT: return true if user selection intersects with the handle's anchor
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

const OneShot = compose(Updatable, {
	methods:{
		eval(){
			return this._hasFired === false
		},
		toString(){
			return 'ONE_SHOT'
		},
		onUpdate(){
			//if all the other ops pass set to true
			if (this._exp.getOps().every(op => op.eval())) {
				this._hasFired = true
			}
		}
	},
	init({exp}){
		this._exp = exp
	},
	deepProps:{
		type: 'OneShot',
		_exp: null,
		_hasFired: false
	}
})
exports.OneShot = OneShot

const TimeWindow = compose(Updatable, {
	methods: {
		async onStart() {
			this._timeOffset = Time({
				ms: Time.Now()
			})
		},
		async onStop() {
			this._timeOffset = Time()
		},
		async onPause() {
			this._timeOffset = Time({
				ms: Time.Now() - this._timeOffset.getTimestamp()
			})
		},
		async onResume() {
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
					if (Unit.ActiveUnits.every(unit => unit.isDone())) {
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
		unit.start()
	}
})
exports.UpdateDriver = UpdateDriver
