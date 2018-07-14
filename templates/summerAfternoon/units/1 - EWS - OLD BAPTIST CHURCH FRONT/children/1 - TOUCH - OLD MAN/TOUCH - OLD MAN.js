/**
 *  TOUCH - OLD MAN
 * 		The man pauses to speak.
 * 		Old Man: Hello?
**/

const improv = require('improv').improv
//import three.js

exports.Touch = (props) => {
	props.history.push(props.nextLine)
	let {
		scene,
		sceneObjects,
		condition,
		children
	} = props
	
	this.load = (props) => {
		let sceneObjects = improv.getSceneObjects(props)
		
		//if DEV_BUILD render the text
	}


	this.update = (renderer, time) => {
		if(condition){
			//TODO: populate this action with behaviors
			//TODO: if touching old man is true, launch child units
		}
	}
}