// DIALOGUE - Old Man: Hello?

const improv = require('improv')
//import three.js
exports.Dialogue = (json) => {
	let speaker = json.speaker
	let text = json.text
	let timeSpan = json.time

	this.load = () => {
		let sceneObjects = improv.getSceneObjects(json)
		improv.loadModels(sceneObjects)
	}

	//render the text for a period of time

	this.update = (renderer, time) => {
		//TODO: populate this Dialogue with behaviors
	}
}