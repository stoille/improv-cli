export let assets = {
	kentucky: `${ROOT}/scenes/kentucky`,
	oldBaptistChurch: `${ROOT}/scenes/kentucky/oldBaptistChurch`
}
export let anims = {
	manWalk: '',
	manPace: '',
}
export let selectors = {
	man: Selector('MAN', behavior.selector.man.pos),
	manCap: Selector('MAN CAP', behavior.selector.manCap),
	manFace: Selector('MAN FACE', behavior.selector.manFace),
	oldBaptistChurchDoor: Selector('OLD BAPTIST CHURCH DOOR', behavior.selector.oldBaptistChurchDoor)
}
		
export let onFirstUpdate = () => {
	//TODO
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