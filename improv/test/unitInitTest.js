const t = require('tap')
const Unit = require('../src/improv').Unit
const {stringify} = require('flatted/cjs')

t.test(`shotInit ...`, t => {
	const shotDef = {
		type: 'Shot',
		scriptPath: './improv',
		sceneHeading: {
			type: 'SceneHeading',
			timeOfDay: 'NOON',
			sceneName: 'OLD BAPTIST CHURCH',
			sceneLocation: 'KENTUCKY'
		},
		shotHeading: {
			type: 'ShotHeading',
			cameraType: 'EWS',
			cameraSource: null,
			cameraTarget: 'OLD BAPTIST CHURCH FRONT',
			movement: {
				type: 'EASE_IN',
				start: 0,
				end: 2
			},
			timeSpan: {
				start: {
					min: 0,
					sec: 0
				},
				end: {
					min: 0,
					sec: 15
				}
			}
		},
		transitions: [{
			type: 'FadeIn',
			time: {
				min: 0,
				sec: 3
			},
			ops: [
				{
					type: 'OneShot',
					opArgs: [{}]
				}, {
					type: 'Select',
					opArgs: [{
						type: 'Selectable',
						handle: 'MAN'
					}]
				}, {
					type: 'TimeWindow',
					opArgs: [{
						start: {
							sec: 5
						},
						end: {
							sec: 10
						}
					}]
				}
			],
			next: {
				type: 'Shot',
				scriptPath: './improv',
				sceneHeading: {
					timeOfDay: 'NOON',
					sceneName: 'OLD BAPTIST CHURCH',
					sceneLocation: 'KENTUCKY'
				},
				shotHeading: {
					cameraType: 'EWS',
					cameraSource: null,
					cameraTarget: 'OLD BAPTIST CHURCH FRONT',
					timeSpan: {
						start: {
							min: 0,
							sec: 0
						},
						end: {
							min: 0,
							sec: 15
						}
					}
				},
				transitions: [{
					type: 'Cut',
					ops: [{
						type: 'ActionBlock',
						actionLines: [{
								time: {
									min: 0,
									sec: 3
								},
								text: 'Foo.'
							},
							{
								time: {
									min: 0,
									sec: 1
								},
								text: 'Bar.'
							},
						]
					}]
				}]
			}
		},{
			type: 'Cut',
			ops:[{
				type: 'ActionBlock',
				actionLines: [{
						time: {
							min: 0,
							sec: 3
						},
						text: 'Over the dense hiss and buzz of a humid summer afternoon we see an old man pace along the porch of an old baptist church.'
					},
					{
						time: {
							min: 0,
							sec: 1
						},
						text: 'He clears his throat and coughs.'
					},
				],
				next: null
			}]
		}]
	}
	let shot = Unit(shotDef)
	let s = stringify(shot)
	//console.log(shot.type + ": "+s)
	t.matchSnapshot(s, 'shotTest')
	t.end()
})