/**
 * CORE
 * */
const compose = require('stampit')
const glob = require('glob')

const DEBUG = true

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
	methods: {
		//isDoneShould be overriden
		isDone(){
			return true
		},
		update() {
			if (this._isUpdateSuspended) {
				return
			}
			if (this._onUpdate) {
				this._onUpdate()
			}
			if (this.isDone()) {
				this.stop({isDone: true})
			}
		},
		async start() {
			this._isUpdateSuspended = false
			let resolve
			this.awaitCondition = new Promise(r => resolve = r)
			this.resolver = resolve
			let results = { awaitCondition: this.awaitCondition }
			if (this._onStart) {
				results.onStart = await this._onStart()
			}
			return results
		},
		/**
		 * await onStop(), await onDone() *
		 	if it exists and resolve. Otherwse, resolve.
		 */
		async stop({isDone}) {
			let results = {}
			if (isDone && this._onDone) {
				results.onDone = await this._onDone()
			}
			this._isUpdateSuspended = true
			if (this._onStop) {
				results.onStop = await this._onStop()
			}
			return this.resolver(results)
		},
		async pause() {
			this._isUpdateSuspended = true
			let results = {}
			if (this._onPause) {
				results.onPauseResult = await this._onPause()
			}
			return results
		},
		async resume() {
			this._isUpdateSuspended = false
			let results = {}
			if (this._onResume) {
				results.onResume = await this._onResume()
			}
			return results
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
		_time: new Date()
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
	}
})
exports.Time = Time

//TODO: consider replacing Time/TimeSpan with more robust time library
const TimeSpan = compose({
	init({
		start,
		end
	}) {
		this._start = Time(start)
		this._end = Time(end)
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
		this._time = Time(time)
		this._timeLeft = this._time.getMilliseconds()
	},
	methods: {
		_onUpdate() {
			this._timeLeft = this._timeLeft - Time.DeltaTime
		},
		isDone() {
			return this.timeLeft <= 0
		}
	}
})
exports.Timer = Timer

const Op = compose(RegisteredType, Awaitable, {
	init(initArgs) {
		let {
			opArgs,
			scope
		} = initArgs
		this.opArgs = opArgs
		//used to allow operator to modify parent state
		this.scope = scope
	},
	methods: {
		eval() {
			//to be overriden by user
			return true
		},
		_onUpdate() {
			if (this.onUpdate) {
				this.onUpdate()
			}
		},
		async _onStart() {
			if (this.onStart) {
				return await this.onStart()
			}
			return true
		},
		async _onStop() {
			if (this.onStop) {
				return await this.onStop()
			}
			return true
		},
		async _onPause() {
			if (this.onPause) {
				return await this.onPause()
			}
			return true
		},
		async _onResume() {
			if (this.onResume) {
				return await this.onResume()
			}
			return true
		},
		async _onUpdate() {
			if (this.onUpdate) {
				return await this.onUpdate()
			}
			return true
		}
	}
})
exports.Op = Op

const Exp = compose(Awaitable, {
	init({
		ops,
		scope
	}) {
		this.operations = ops.map(opArgs => Op({ ...opArgs, scope, exp: this }))
		this.eval = () => this.operations.find(op => op.eval())
	},
	methods: {
		_onupdate() {
			this.operations.forEach(op => op.update())
		}
	}
})
exports.Exp = Exp


//a curr's thoughts are more reliable than the next's
// but the next's can always be more varied
//a curr's lies are more reliable than their next's
// but the next's can always be more imaginative
//corollary: a curr's mistakes are only more subtle than the next's, but not fewer
//corollary: the master's mistakes are only more subtle than the student's, but not fewer
//operations on units are like little flexible fortune cookie relationships you can apply onto an executable scope
const Transition = compose(RegisteredType, Awaitable, {
	init({
			exp,
			timer,
			curr,
			next
		}){
		this._curr = curr
		this._next = next
		this._timer = timer
		this._expression = exp
	},
	methods: {
		isDone(){
			return this._isDone 
		},
		/** A transition is "done" when its expression has been satisfied AND:
		 * 1 - the timer is up
		 * 2 - the current unit stops
		 * 3 - the next unit starts
		 **/
		async onDone(){
			let results = {}
			results.onDoneTimer = await this._timer.start()
			results.onStopCurr = await this._curr.stop()
			results.onStartNext = await this._next.start()
			return results
		},
		async _onStart(){
			let results = {}
			
			if (this._expression) {
				results.onStartExp = await this._expression.start()
				results.awaitExp = this._expression.awaitCondition
			}

			if(this.onStart){
				results.onStart = await this.onStart()
			}
			return results
		},
		async _onStop() {
			let results = {}
			results.onStopTimer = this._timer.stop()
			results.onStopExp = await this._expression.stop()
			if (this.onStop) {
				results.onStop = await this.onStop()
			}
			return results
		},
		async _onPause() {
			let results = {}
			results.onPauseTimer = this._timer.pause()
			if (this.onPause) {
				results.onPause = await this.onPause()
			}
			return results
		},
		async _onResume() {
			let results = {}
			results.onResumeTimer = this._timer.resume()
			if (this.onResume) {
				results.onResume = await this.onResume()
			}
			return results
		},
		_onUpdate() {
			if (this._expression) {
				this._expression.update()
				this._isDone = this._expression.eval()
			}
			//update the previous unit until the transition is complete since Unit.ActiveUnit == next as soon as the transtiion has started (when this.isDone() == true)
			if(this.isDone()){
				this._curr.update()
			}
			//let interp = this._timer.update()
			if(this.onUpdate){
				this.onUpdate()
			}
		},
		async load(){
			return this._next.load()
		}
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
		ActiveUnit: null,
		History: []
	},
	init(initArgs) {
		let {
			transitions,
			scriptPath
		} = initArgs
		this._scriptPath = scriptPath
		this._script = require(scriptPath)

		if(transitions){
			this.transitions = transitions.map(t => {
				let {type, exp, time, next } = t
				let tDef = { type, timer: Timer({ time }), curr: this }
				tDef.curr = this
				tDef.next = next ? Unit(next) : null
				
				
				if(exp){
					tDef.exp = Exp(exp)
				}
				
				return Transition(tDef)
			})
		}
	},
	methods: {
		async _onStart(){
			this._state = State.IN_TRANSITION
			Unit.ActiveUnit = this
			Unit.History.push(this._scriptPath)
			let results = {}
			//wait until all transitions start
			results.onStartTransitions = await Promise.all(this.transitions.map( t => t.start()))
			//onStart() must be defined in inherited type
			if(this.onStart){
				this._state = State.UPDATE
				retuls = await this.onStart()
			}
			return results
		},
		async _onStop(){
			let results = {}
			//wait until all transitions start
			results.onStopTransitions = await Promise.all(this.transitions.map(t => t.onStop()))

			if (this.onStop) {
				this._state = State.STOP
				results = await this.onStop()
			}
		},
		async _onPause() {
			let results = {}
			//wait until all transitions start
			results.onPauseTransitions = await Promise.all(this.transitions.map(t => t.onPause()))

			if (this.onPause) {
				this._lastState = this._state
				this._state = State.PAUSE
				results = await this.onPause()
			}
		},
		async _onResume() {
			let results = {}
			//wait until all transitions start
			results.onResumeTransitions = await Promise.all(this.transitions.map(t => t.onResume()))

			if (this.onResume) {
				this._state = this._lastState
				results = await this.onResume()
			}
		},
		_onUpdate(){
			//IDEA: parallel-unit support can be enabled by using filter() instead of find()
			this.transitions.forEach(t => t.update())

			this.updateScript()
			//onUpdate() must be defined in inherited type
			this.onUpdate()
		},
		updateScript(){
			if (this._script) {
				if (this.isFirstUpdate) {
					this.isFirstUpdate = false
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
	}
})
exports.Unit = Unit

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
		this._sceneHeading = SceneHeading(sceneHeading)
		this._shotHeading = ShotHeading(shotHeading)
		let modelsPath = `${this._scriptPath}/models`
		this._models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${this._scriptPath}/anims`
		this._anims = listFilesWithExt(animsPath, '.fbx')

		if (actionLines) {
			this._actionBlock = ActionBlock({actionLines, scope: this})
		}

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
		isDone(){
			return this._isDone
		},
		async onStart(){
			//TODO: investigate optimizing loading on start
			let results = {}
			results.onLoad = await Promise.all(this.transitions.map(t => t.load()))
			this.setupCamera()
			this.startAnimations()
			results.onActionBlock = await this._actionBlock.start()
			//when the action block finishes set this._isDone = true to finish the shot
			this._actionBlock.awaitCondition.then( () => this._isDone = true)
			return results
		},
		async load() {
			this._state = State.LOAD
			this._models = await load(this._models, Shot.ModelLoader)
			this._anims = await load(this._anims, Shot.AnimLoader)
			this._state = State.READY
			return {onLoadModels: this._models, onLoadAnims: this._anims}
			//create ModelLoader classes
			async function load(assets, loader) { 
				/* TODO: implement this
				return Promise.all(Object.keys(this._models).map(
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
			this._state = State.UNLOAD
			//TODO
			this._state = State.DONE
		},
		async onStop() {
			//TODO: investigate optimizing unloading on stop
			let results = {}
			results.unload = await this.unload()
			return results
		},
		onUpdate(){
			this._actionBlock.update()
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

const ActionLine = compose(Awaitable, {
	init({
		text,
		time
	}) {
		this._text = text
		this._timer = Timer({time})
	},
	methods: {
		async _onStart() {
			console.log(this._text)
			await this._timer.start()
		},
		_onUpdate(){
			this._timer.update()
			//TODO: animated closed captions
		}
	}
})
exports.ActionLine = ActionLine

const ActionBlock = compose(Awaitable, {
	init({
		actionLines
	}) {
		this._actionLines = actionLines.map(actionLine => ActionLine({
			actionLine
		}))
	},
	methods: {
		isDone(){
			return this._isDone
		},
		async _onStart() {
			let results = {onActionLines: []}
			for (let actionLine of this._actionLines) {
				results.onActionLines.push(await actionLine.start())
			}
			//when the action lines are all done set this._isDone = true
			Promise.all(this._actionLines.map( a => a.awaitCondition ))
				.then( () => this._isDone = true )
			return results
		},
		_onUpdate() {
			this._activeActionLine.update()
		}
	}
})
exports.ActionBlock = ActionBlock

const Text = compose({
	init({
		text
	}) {
		this._text = text
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
		onUpdate(){
			//TODO: anchor handle to correct location
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
		async onStart(){
			this.timeOffset = Time.Now()
		},
		async onStop(){
			this.timeOffset = 0
		},
		async onResume(){
			this.timeOffset = Time.Now() + this.timeOffset
		},
		async onPause(){
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
			if(!this._isInitialized){
				this._isInitialized = true
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
