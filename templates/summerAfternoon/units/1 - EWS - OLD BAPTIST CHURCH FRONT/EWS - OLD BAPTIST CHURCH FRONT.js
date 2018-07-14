/**
 *  
 * FADE IN:
 * 	EXT.OLD BAPTIST CHURCH, KENTUCKY - NOON
 * EWS - OLD BAPTIST CHURCH FRONT - 05
 * Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.
 *
 * TOUCH - OLD MAN
 * The man pauses to speak.
 * Old Man: Hello ?
 *
 * 	TOUCH - OLD MAN CAP
 * He anxiously brushes through his hair and crumples his cap
 * while he paces.He pauses in contemplation and strokes his beard.
 *
 * CU - OLD MAN FACE - 00: 04
 * We see the old man 's wrinkled face.
 *
 * AFTER - OLD BAPTIST CHURCH FRONT
 * Old Man: Is there anybody out there ?
 * 	AFTER - OLD BAPTIST CHURCH DOOR
 * Old Man: Is there anybody in there ?
 * 	AFTER - OLD MAN OLD BAPTIST CHURCH FRONT
 * Old Man: Is there anybody in there ?
 * 	AFTER - OLD MAN CAP
 * Old Man: Hmph...
 *
 * 	AFTER - TOUCH - OLD MAN CAP - OR - TOUCH - OLD MAN
 * ONCE - TOUCH - OLD BAPTIST CHURCH DOOR
 * LONG SHOT - CHURCH FRONT - 00: 04
 * The long church doors tower above a wraparound porch.A glimmer in the bush catches our eye.
 * AWAIT - TOUCH - BUSH
 * LONG SHOT - MAN, BUSH - 00: 04
 * A light breeze picks up as we notice a key in the bush.
 * AWAIT - PICKUP - KEY
 * The man bends down to investigate.
 * CU - OLD MAN FACE - 00: 04
 * We see an old key in the palm of his cracked hands.
 *
 * AWAIT - PICKUP - KEY - AND - TOUCH - OLD MAN CAP
 **/

import { improv } from 'improv'
import { script } from 'summerAfternoon'

async function loadUnitFromScript(scriptPath){
	return await improv(script)
}

//TODO: restructure units using this definition
const Unit = {
	init({ conditionals, holdConditional, nextUnit }) {
		this.conditionals = conditionals.map(({condition, unit}) => ConditionalUnit(condition, unit))
		this.holdConditional = ConditionalUnit({holdConditional, nextUnit})
	},
	props: {
		state: UnitState({state:UnitState.PLAY, value: 0})
	},
	methods:{
		run(){
			if (this.state === UnitState.BACKGROUND && this.state === UnitState.INACTIVE){
				return
			}
			let activeConditional = this.conditionals.find(conditional => conditional.eval())
			if(activeConditional){
				this.giveControlTo(activeConditional.unit, UnitState.BACKGROUND)
			} else if (this.state === UnitState.HOLD && this.holdConditional.eval()) {
				this.giveControlTo(this.holdConditional.unit, UnitState.INACTIVE)
			}
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

const ConditionalUnit = compose({
	init({ condition, unit }) {
		this.condition = Exp(condition)
		this.unit = Unit(unit)
	}
})

const Exp = compose({
	init({ op, lhs, rhs }) {
		this.op = op 
		this.lhs = lhs.map( exp => Exp(exp))
		this.rhs = rhs.map( exp => Exp(exp))
	},
	methods: {
		eval(){
			return this.op(lhs.eval(), rhs.eval())
		}
	}
})

//shot as a unit
const Shot = compose(Unit,{
	props: {
		time: Time({ms:0}) 
	},
	init({ transition, sceneHeading, shotHeading, actions }) {
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.actions = actions.map(action => Action(action))
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
	properties: {
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
			return ({ status: loaded })
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
		unloadAssets() {
			await this.unloadSceneObjects()
			await this.unloadUnits()
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
	initializers: [function ({ }) {
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
			
			if(this.currentAction.isOver){
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
	initializers: [function ({shot}) {
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
	initializers: [function ({ text, animations }) {
		this.text = text
		this.animations = animations
	}]
})

const assets = {
	oldManPath: `./assets/oldMan`,
	oldManCapPath: `./assets/oldManCap`,
	oldBaptistChurchKentuckyPath: `./assets/oldBaptistChurchKentucky`,
	oldBaptistChurchDoorPath: `./assets/oldBaptistChurchDoor`,
	oldBaptistChurchFrontPath: `./assets/oldBaptistChurchFront`,
	runConditionPath: `./assets/runCondition`,
	awaitConditionPath: `./assets/awaitCondition`,
	actionsPath: `./assets/actions`
}

const anims = {
	oldManPath: `./assets/oldMan`,
	oldManCapPath: `./assets/oldManCap`,
	oldBaptistChurchKentuckyPath: `./assets/oldBaptistChurchKentucky`,
	oldBaptistChurchDoorPath: `./assets/oldBaptistChurchDoor`,
	oldBaptistChurchFrontPath: `./assets/oldBaptistChurchFront`,
	runConditionPath: `./assets/runCondition`,
	awaitConditionPath: `./assets/awaitCondition`,
	actionsPath: `./assets/actions`
}

const EWS_OldBaptistChurchFront = Shot({
	onInit: () => {
		this.loadAssets(shotAssets)
		this.loadAnimations(shotAnims)
		this.loadActions(shotActions)
	},
	onFirstUpdate: () => {
		this.setupCamera()
		this.startAnimations()
		//set camera to this shot
	},
	onUpdate: () => {
		//visits all children units and hands over control if their condition is true
		this.visitChildren()
		
		//TODO: populate this action with behaviors
	}
})
