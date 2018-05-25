/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`helloTest.js TAP readScriptFile: ../scripts/hello.imp... hello parsed... > hello 1`] = `
[ Unit {
    type: 'unit',
    parent: null,
    decorators: [ { type: 'comment', text: 'comment' } ],
    scene: 
     { type: 'scene',
       scenePlacement: 'INT',
       sceneName: 'WALL, WALL ',
       sceneTime: 'DUSK',
       transition: { type: 'transition', transitionType: 'FADE IN' },
       shots: 
        [ { type: 'shot',
            camType: 'EWS',
            camSource: { root: 'MAN', path: [ 'UP', 'EAST' ] },
            camTarget: { root: 'WALL', path: [ 'EAST', 'UP' ] },
            time: { sec: 1 },
            actions: 
             [ { type: 'action',
                 lines: 
                  [ { text: 'Aaa.', time: { sec: 2 } },
                    { text: 'AAA.', time: { sec: 3 } } ] },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'TAP',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: { type: 'selector', root: 'FOO', path: [] } } } ],
                 child: 
                  Unit {
                    type: 'unit',
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { type: 'scene',
                       scenePlacement: 'INT',
                       sceneName: 'WALL, WALL ',
                       sceneTime: 'DUSK',
                       shots: 
                        [ { type: 'shot',
                            camType: 'MCU',
                            camSource: { root: 'WALL', path: [] },
                            camMovement: 'EASE IN',
                            time: { sec: 5 },
                            actions: [ { type: 'action', lines: [ { text: 'Ccc.' } ] } ] } ] } } },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'TAP',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: { type: 'selector', root: 'BAR', path: [] } } } ],
                 child: 
                  Unit {
                    type: 'unit',
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { type: 'scene',
                       scenePlacement: 'INT',
                       sceneName: 'WALL, WALL ',
                       sceneTime: 'DUSK',
                       shots: 
                        [ { type: 'shot',
                            camType: 'LONG SHOT',
                            camSource: { root: 'WALL', path: [] },
                            camMovement: 'EASE IN',
                            time: { sec: 5 },
                            actions: [ { type: 'action', lines: [ { text: 'Ddd.' } ] } ] } ] } } } ] },
          { type: 'shot',
            camType: 'CU',
            camSource: { root: 'WALL', path: [] },
            camMovement: 'EASE IN',
            time: { sec: 5 },
            actions: [ { type: 'action', lines: [ { text: 'Bbb.' } ] } ] } ] } } ]
`
