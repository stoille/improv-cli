/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`helloTest.js TAP readScriptFile: ../scripts/hello.imp... hello parsed... > hello 1`] = `
[ Unit {
    parent: null,
    decorators: [ { text: 'comment' } ],
    scene: 
     { scenePlacement: 'INT',
       sceneName: 'WALL, WALL',
       sceneTime: 'DUSK',
       transition: { transitionType: 'FADE IN' },
       shots: 
        [ { camType: 'EWS',
            camSource: { root: 'MAN', path: [ 'UP', 'EAST' ] },
            camTarget: { root: 'WALL', path: [ 'EAST', 'UP' ] },
            camMovement: null,
            time: { min: null, sec: 11 },
            activeObjects: [],
            actions: 
             [ { lines: 
                  [ { text: 'Aaa.', time: { min: null, sec: 21 } },
                    { text: 'AAA.', time: { min: null, sec: 31 } } ] },
               { condition: 
                  { op: null,
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'TAP FOO', path: [] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'INT',
                       sceneName: 'WALL, WALL',
                       sceneTime: 'DUSK',
                       shots: 
                        [ { camType: 'EWS',
                            camSource: { root: 'MAN', path: [ 'UP', 'EAST' ] },
                            camTarget: { root: 'WALL', path: [ 'EAST', 'UP' ] },
                            camMovement: null,
                            time: { min: null, sec: 11 },
                            activeObjects: [],
                            actions: [] },
                          { camType: 'MCU',
                            camSource: { root: 'WALL', path: [] },
                            camTarget: { root: 'WALL', path: [] },
                            camMovement: 'EASE IN',
                            time: { min: null, sec: 51 },
                            activeObjects: [],
                            actions: [ { lines: [ { text: 'Ccc.', time: { min: 0, sec: 0 } } ] } ] } ] } } },
               { condition: 
                  { op: null,
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'TAP BAR', path: [] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'INT',
                       sceneName: 'WALL, WALL',
                       sceneTime: 'DUSK',
                       shots: 
                        [ { camType: 'EWS',
                            camSource: { root: 'MAN', path: [ 'UP', 'EAST' ] },
                            camTarget: { root: 'WALL', path: [ 'EAST', 'UP' ] },
                            camMovement: null,
                            time: { min: null, sec: 11 },
                            activeObjects: [],
                            actions: [] },
                          { camType: 'LONG SHOT',
                            camSource: { root: 'WALL', path: [] },
                            camTarget: { root: 'WALL', path: [] },
                            camMovement: 'EASE IN',
                            time: { min: null, sec: 51 },
                            activeObjects: [],
                            actions: [ { lines: [ { text: 'Ddd.', time: { min: 0, sec: 0 } } ] } ] } ] } } } ] },
          { camType: 'CU',
            camSource: { root: 'WALL', path: [] },
            camTarget: { root: 'WALL', path: [] },
            camMovement: 'EASE IN',
            time: { min: null, sec: 5 },
            activeObjects: [],
            actions: [ { lines: [ { text: 'Bbb.', time: { min: 0, sec: 0 } } ] } ] } ] } } ]
`
