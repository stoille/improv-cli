/**
 * CORE
 * */
async function loadUnitFromScript(scriptPath){
	return await improv(script)
}

//TODO: restructure units using this definition
const Unit = {
	init({ conditionals, holdConditional, nextUnit }) {
		this.conditionals = conditionals.map(({ condition, unit }) => Conditional(condition, unit))
		this.holdConditional = Conditional({conditonalText: holdConditional, parent: nextUnit, child: this})
	},
	props: {
		state: UnitState({state:UnitState.PLAY, value: 0})
	},
	methods:{
		evalConditionals(){
			if (this.state === UnitState.BACKGROUND || this.state === UnitState.INACTIVE){
				return false
			}
			let activeConditional = this.conditionals.find(conditional => conditional.eval())
			if(activeConditional){
				this.giveControlTo(activeConditional.unit, UnitState.BACKGROUND)
				return true
			}
			if (this.state === UnitState.HOLD && this.holdConditional.eval()) {
				this.giveControlTo(this.holdConditional.unit, UnitState.INACTIVE)
				return true
			}
			return false
		},
		giveControlTo(unit, state){
			unit.activate()
			this.state = state
		},
		activate(){
			this.state = State.ACTIVE
		}
	}
}

const UnitState = compose({
	statics:{
		BACKGROUND: 'BACKGROUND',
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE',
		HOLD: 'HOLD'
	},
	init({state, value}){
		this.state = state
		this.value = value
	}
})

const Conditional = compose({
	init({conditonalText, parent, child}) {
		this.child = child
		this.preds = conditonalText.reduce( (preds, verb, idx, conds) => { 
			let pred = Predicates.GetPredicate(verb)
			if(pred){
				let args = conds.GetArgs(preds, idx)
				let predInst = pred.create({ verb: verb, args, scope:parent})
				return [...preds, predInst]
			}
			return preds
		}, [])
	},
	methods: {
		eval(){
			return this.preds.find( p => !p.eval() ) ? false : true
		}
	}
})

const Predicate = compose({
	statics: {
		GetPredicate(verb){
			return Predicate._preds[verb]
		},
		AddPredicate(pred){
			Predicate._preds[pred.verb] = pred
		}
	},
	init({ verb, args, scope }) {
		this.verb = verb
		this.args = args
		this.scope = scope
	},
	//TODO: add more predicates via AddPredicate
	//TODO: override eval(), GetArgs() methods with specific behavior
	methods: {
		Eval(){
			return true
		},
		GetArgs(rhsText, idx) {
			return rhsText.slice(idx)
		}
	}
})

/**
 * MODELS
 * */

const ShotState = compose(UnitState,{
	statics: {
		PLAY: 'PLAY',
		STOP: 'STOP'
	}
})

//shot as a unit
const Shot = compose(Unit,{
	props: {
		time: Time({ms:0}),
		actionIndex: 0
	},
	init({ transition, sceneHeading, shotHeading, actions }) {
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.actions = actions.map(action => Action(action))
	},
	methods:{
		play(){
			if(this.state === ShotState.STOP){
				return false
			}
			if(this.evalConditions()){
				return false
			}  
			if (this.activeAction.isDone()) {
				this.actionIndex += 1
				this.activeAction = this.actions[this.actionIndex]
				this.activeAction.start()
			}
			return true
		}
	}
})

const Transition = compose({
	init({ transitionType, transitionTime }) {
		this.transitionType = transitionType 
		this.transitionTime = TimeSpan(transitionTime)
	}
})

const SceneHeading = compose({
	init({ setting, sceneName, sceneLocation, sceneLength }) {
		this.setting = setting 
		this.sceneName = sceneName
		this.sceneLocation = sceneLocation
		this.sceneTime = TimeSpan(sceneLength)
	}
})

//shotheading
const ShotHeading = compose({
	init({ cameraType, cameraSource, cameraTarget, timeSpan }) {
		this.cameraType = cameraType 
		this.cameraSource = cameraSource
		this.cameraTarget = cameraTarget 
		this.timeSpan = timeSpan
	}
})

//time
const Time = compose({
	init({ ms }) {
		this.time = ms
	}
})

const Text = compose({
	init({ text }) {
		this.text = text
	}
})

//length
const TimeSpan = compose({
	init({ start, end }) {
		this.from = Time(from)
		this.to = Time(to)
	}
})
//actions
const Action = compose({
	init({ text, length }) {
		this.text = Text(text)
		this.length = TimeSpan(length)
	}
})
////////
function* mainLoop(unit) {
	let lastUnit = unit
	while(unit = unit.next()){
		if (lastUnit !== unit){
			if(DEBUG){
				console.log(`changed to Unit: ${unit}`)
				yield unit.loadAssets()
				yield lastUnit.unloadAssets()
			}
		}
		let unitState = yield unit.visit()
		lastUnit = unit
}

/**
 *

 const Predicate = compose({
 	methods: {
 		isTrue: () => {
 			this.eval(predicate.subjects)
 		},
 		eval: (subjects) => {
 			//TODO
 		},
 		run: () => {}
 		//override and define predicates for TOUCH, AFTER, AWAIT, PICKUP
 		//if its a unit
 		//this.giveControlTo(cond.body)
 		//if its an action or dialogue
 		//this.addAction(cond.body)
 	}
 })

 const Unit = compose({
 	props: {
 		runCondition,
 		awaitCondition,
 		actions
 	},
 	methods: {
 		loadAssets: async (depth) => {
 			if (depth > 1) {
 				return null
 			}
 			let sceneObjects = await this.loadSceneObjects(sceneUnit, sceneSubjects)
 			this.children = this.children.map(child = new Unit(child))
 			for (let i = 0; i < unit.length; ++i) {
 				let loadStatus = await this.children[i].loadAssets(depth + 1)
 				console.log(loadStatus)
 			}
 			return ({
 				status: loaded
 			})
 		},
 		evalPredicates: () => {
 			for (let predicate in this.predicates) {
 				if (predicate.isTrue()) {
 					predicate.run(this)
 					break
 				}
 			}
 		},
 		giveControlTo: (unit) => {
 			Unit.activeUnit = unit
 			Unit.history.push(unit.nextLine)
 		},
 		condition() {
 			//TODO: evaluate condition
 			return true
 		},
 		onUnload: () => {
 			this.unloadAssets()
 			this.unloaAnimations()
 			this.unloadActions()
 		},
 		async loadSceneObjects() {
 			if (isSceneObjectsLoaded) {
 				return sceneObjects
 			}
 			//load scene objects
 			return sceneObjects
 		},
 		async loadUnits() {
 			if (isSceneObjectsLoaded) {
 				return sceneObjects
 			}
 			//load scene objects
 			return sceneObjects
 		},
 		async unloadSceneObjects() {
 			if (isSceneObjectsLoaded) {
 				return sceneObjects
 			}
 			//unload scene objects
 			return sceneObjects
 		},
 		async unloadUnits() {
 			if (isSceneObjectsLoaded) {
 				return sceneObjects
 			}
 			//unload scene objects
 			return sceneObjects
 		}
 	},
 	initializers: [function ({}) {
 		this.runCondition = runCondition,
 			this.awaitCondition = awaitCondition,
 			this.actions = actions
 	}]
 })
 export default Unit

 const Shot = compose(Unit, {
 	methods: {
 		update: async function () {

 		},
 		initialize: () => {
 			//if DEV_BUILD render the text
 			this.setupCamera()
 			this.startAnimations()
 			//start animations
 		},
 		setupCamera: () => {

 		},
 		startAnimations: () => {},
 		loadAssets: (shotAssets) => {},
 		loadAnimations: (shotAnims) => {},
 		loadActions: (shotActions) => {

 		},
 		shotUpdate: () => {
 			this.evalconditionals()

 			if (this.currentAction.isOver) {
 				this.setCurrentAction(currentAction.next)
 			}
 		},
 		runOp: (o.branchp) => {
 			this.setCurrentShot(op.shot)
 		},
 		setCurrentAction: (nextAction) => {
 			Shot.currentAction.stopAnimations()
 			Shot.currentAction = nextAction
 			Shot.currentAction.start()
 		},
 		setCurrentShot: (nextShot) => {
 			this.unloadStaleAssets(nextShot, this)
 			Shot.currentShot = nextShot //static
 		},
 	},
 	initializers: [function ({
 		shot
 	}) {
 		this.shot = shot
 		shot.onInit()

 		this.camera = camera
 		this.animations = animations
 		this.onInit()
 	}]
 })

 const Action = compose({
 	methods: {
 		update: async function () {

 		},
 		start: () => {
 			//if DEV_BUILD render the text

 			this.startAnimations()
 			//start animations
 		},
 		setupCamera: () => {

 		},
 		startAnimations: () => {

 		},
 	},
 	initializers: [function ({
 		text,
 		animations
 	}) {
 		this.text = text
 		this.animations = animations
 	}]
 })
 */