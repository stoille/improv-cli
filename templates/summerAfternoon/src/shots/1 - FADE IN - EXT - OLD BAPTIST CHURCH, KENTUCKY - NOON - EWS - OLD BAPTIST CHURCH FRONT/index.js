import { Shot } from '../../improv'
let shotId = '.' //TODO: figure out how to define this
let shot = Shot.GetShot(shotId)

export let models = {
	kentucky: `${ROOT}/scenes/kentucky`,
	oldBaptistChurch: `${ROOT}/scenes/kentucky/oldBaptistChurch`,
	man: ''
}
export let anims = {
	kentucky: {},
	man: { 
		manWalk: 'manWalkPath',
		manPace: 'manPacePath'
	}
}
		
export let onFirstUpdate = () => {
	//TODO
	shot.selectors.man.anchor = shot.models.man
	shot.selectors.manCap.anchor = shot.models.manCap
	shot.selectors.manFace.anchor = shot.models.manFace
	shot.selectors.oldBaptistChurchDoor.pos =  new Position({x: 0, y: 0, z: 0})
	 
}

export let onUpdate = () => {
	//TODO
}

	//how are select topics defined?
	//TODO: finish loading code,
	//TODO: finish rest of indexes,
	//TODO: mock tests for running events,
	//TODO: fix parser to generate IL JSON,
	//TODO: improv generator: IL JSON -> JS project files
	//TODO: file watch live compiling
	//IDEA: syntax or hotkey/markup to define targets
	//IDEA: syntax or hotkey/markup to define actions (functions, grammar)
	//IDEA: model conditionals as target-actions whose target is fixed to the control flow of the conditional's parent and action is programmatically defined. Actions can act on parent state (e.g. VISITED, FIRST, AFTER, ONESHOT) or user events (SELECT, TOUCH)