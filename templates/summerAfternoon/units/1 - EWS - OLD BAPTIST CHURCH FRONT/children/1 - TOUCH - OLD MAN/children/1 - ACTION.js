// ACTION - The man pauses to speak.

const improv = require('improv').improv
//import three.js

exports.Action = (json) => {
	let text = json.text
	let timeSpan = json.time
	let scene = improv.findScene(json)
	let sceneObjects = improv.findSceneObjects(json)

	this.load = () => {
		let sceneObjects = improv.getSceneObjects(json)
		improv.loadModels(sceneObjects)
			//if DEV_BUILD render the text
	}

	
	this.update = (renderer, time) => {
		//TODO: populate this action with behaviors
	}
}