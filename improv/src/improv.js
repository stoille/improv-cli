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
	init({
		isDone
	}) {
		this.isDone = isDone
	},
	methods: {
		update() {
			if (!this.isActive) {
				return
			}
			if (this._onUpdate) {
				this._onUpdate()
			}
			if (this._isDone()) {
				this._stop()
			}
		},
		async start() {
			this.isActive = true
			let resolve
			let p = new Promise(resolve => resolve = resolve)
			this.resolver = resolve
			if (this._onStart) {
				this.results.onStart = await this._onStart()
			}
			return p
		},
		/**
		 * await onStop(), await onDone() *
		 	if it exists and resolve. Otherwse, resolve.
		 */
		async stop() {
			this.isActive = false
			if (this._onStop) {
				this.results.onStop = await this._onStop()
			}
			if (this._onDone) {
				this.results.onDoneResult = await this._onDone()
			}
			this.resolver(this.results)
			return this.results
		},
		async pause() {
			this.isActive = false
			if (this._onPause) {
				this.results.onPauseResult = await this._onPause()
			}
			return this.results
		},
		async resume() {
			this.isActive = true
			if (this._onResume) {
				this.results.onResume = await this._onResume()
			}
			return this.results
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

//a prev's thoughts are more reliable than the next's
// but the next's can always be more constied
//a prev's lies are more reliable than their next's
// but the next's can always be more imaginative
//corollary: a prev's mistakes are only more subtle than the next's, but not fewer
//corollary: the master's mistakes are only more subtle than the student's, but not fewer
//operations on units are like little flexible fortune cookie relationships you can apply onto an executable scope
const Transition = compose(RegisteredType, Awaitable, {
	init({
			exp,
			timer,
			prev,
			next
		}){
		this.prev = prev
		this.next = next
		this.timer = timer
		let expression = exp
		this.eval = expression ? expression.eval.bind(this.prev) : () => true
	},
	methods: {
		async onStart() {
			return await Promise.all(this.prev.stop(), this.timer.start(), this.next.start())
		},
		async onUpdate() {
			let interp = this.timer.update()
			//TODO: tick the transitions over prev/next units
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
 			prev: Object.create(prev)
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
		this.scriptPath = scriptPath
		this.script = require(scriptPath)

		if(transitions){
			this.transitions = transitions.map(t => {
				let {
					type,
					exp,
					time,
					prev,
					next
				} = t
				let tDef = {
					type,
					timer: Timer({
						time
					})
				}
				if(exp){
					tDef.exp = Exp(exp)
				}
				if(prev){
					tDef.prev = prev
				}
				if(next){
					tDef.next = Unit(next)
				}
				return Transition(tDef)})
		}
	},
	methods: {
		async _onStart(){
			this.state = State.IN_TRANSITION
			Unit.ActiveUnit = this
			Unit.History.push(this.scriptPath)
			//onStart() must be defined in inherited type
			if(this.onStart){
				this.results.onStart = await this.onStart()
				this.state = State.UPDATE
			}
			return this.results
		},
		async _onStop(){
			if (this.onStop) {
				this.results.onStop = await this.onStop()
				this.state = State.STOP
			}
			return this.results
		},
		async _onPause() {
			if (this.onPause) {
				this.results.onPause = await this.onPause()
				this.lastState = this.state
				this.state = State.PAUSE
			}
			return this.results
		},
		async _onResume() {
			if (this.onResume) {
				this.results.onResume = await this.onResume()
				this.state = this.lastState
			}
			return this
		},
		_onUpdate(){
			this.updateTransitions()
			this.updateScript()
			//onUpdate() must be defined in inherited type
			this.onUpdate()
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
		updateTransitions() {
			this.transitions.forEach(transition => transition.update())
		}
	}
})
exports.Unit = Unit

const Exp = compose({
	init({
		ops,
		scope
	}) {
		let operations = ops.map( opArgs => Op({...opArgs, scope, exp:this}))
		this.eval = () => operations.find(op => op.eval())
	}
})
exports.Exp = Exp

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
			//isDone defined in Awaitable init
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
			this.actionBlock = ActionBlock({actionLines, scope: this})
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
		async onStart(){
			setupCamera()
			startAnimations()
			this.results.onActionBlockStart = await this.actionBlock.start()
			this.results.onLoad = await Promise.all(this.transitions.map(t => t.next.load()))
			return await this.stop()

			function setupCamera() {
				//TODO
			}
			function startAnimations() {
				//TODO
			}
		},
		async onStop(){
			//TODO: reinvestigate unloading on stop
			this.results.unload = await this.unload()
		},
		async load() {
			this.state = State.LOAD
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)
			this.state = State.READY

			async function load(assets, loader) { 
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
			}
		},
		async unload(){
			this.state = State.UNLOAD
			//TODO
			this.state = State.DONE
		},
		onUpdate(){
			this.actionBlock.update()
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
		this.text = text
		this.timer = Timer({time})
	},
	methods: {
		async _onStart() {
			console.log(this.text)
			await this.timer.start()
		},
		_onUpdate(){
			this.timer.update()
			//TODO: animated closed captions
		}
	}
})
exports.ActionLine = ActionLine

const ActionBlock = compose(Awaitable, {
	init({
		actionLines
	}) {
		this.actionLines = actionLines.map(actionLine => ActionLine({
			actionLine
		}))
	},
	methods: {
		async _onStart() {
			this.isActive = true
			for (let actionLine of this.actionLines) {
				this.activeActionLine = await actionLine.start()
			}
		},
		_onUpdate() {
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
		async _onStart() {
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
		async _onStart(){
			this.timeOffset = Time.Now()
		},
		async _onStop(){
			this.timeOffset = 0
		},
		async _onResume(){
			this.timeOffset = Time.Now() + this.timeOffset
		},
		async _onPause(){
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
