/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`summerAfternoonTest.js TAP readScriptFile: ../scripts/summerAfternoon.imp... summerAfternoon parsed... > summerAfternoon 1`] = `
[ Unit {
    type: 'unit',
    parent: null,
    decorators: [ { type: 'comment', text: 'comments bla bla' } ],
    scene: 
     { type: 'scene',
       scenePlacement: 'EXT',
       sceneName: 'Old Baptist Church, Kentucky ',
       sceneTime: 'NOON',
       transition: { type: 'transition', transitionType: 'FADE IN' },
       shots: 
        [ { type: 'shot',
            camType: 'EWS',
            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
            time: { sec: 5 },
            actions: 
             [ { type: 'action',
                 lines: 
                  [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.' },
                    { text: 'The man pauses to speak.' } ] },
               { type: 'dialogue',
                 speaker: 'Old Man',
                 lines: [ { text: 'Hello world?' } ] },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'TOUCH',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: { type: 'selector', root: 'MAN', path: [ 'CAP' ] } } } ],
                 child: 
                  Unit {
                    type: 'unit',
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { type: 'scene',
                       scenePlacement: 'EXT',
                       sceneName: 'Old Baptist Church, Kentucky ',
                       sceneTime: 'NOON',
                       shots: 
                        [ { type: 'shot',
                            camType: 'EWS',
                            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                            time: { sec: 5 },
                            actions: 
                             [ { type: 'action',
                                 lines: 
                                  [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.' },
                                    { text: 'He stops to stroke his beard.' } ] } ] },
                          { type: 'shot',
                            camType: 'CU',
                            camTarget: { root: 'OLD', path: [ 'FACE' ] },
                            time: { min: 0, sec: 4 },
                            actions: 
                             [ { type: 'action',
                                 lines: [ { text: 'We see the old man\\'s white beard.' } ] } ] } ] } } },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'TOUCH',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: 
                          { type: 'selector',
                            root: 'OLD_BAPTIST_CHURCH',
                            path: [ 'FRONT', 'DOOR' ] } } } ],
                 child: 
                  Unit {
                    type: 'unit',
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { type: 'scene',
                       scenePlacement: 'EXT',
                       sceneName: 'Old Baptist Church, Kentucky ',
                       sceneTime: 'NOON',
                       shots: 
                        [ { type: 'shot',
                            camType: 'LONG SHOT',
                            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                            time: { min: 0, sec: 4 },
                            actions: 
                             [ { type: 'action',
                                 lines: [ { text: 'The long church doors tower above a wraparound porch.' } ] },
                               { type: 'control',
                                 conditions: 
                                  [ { type: 'exp',
                                      op: 'TOUCH',
                                      rhs: 
                                       { type: 'exp',
                                         op: 'EQT',
                                         rhs: { type: 'selector', root: 'BUSH', path: [] } } } ],
                                 child: 
                                  Unit {
                                    type: 'unit',
                                    parent: [Circular],
                                    decorators: [],
                                    scene: 
                                     { type: 'scene',
                                       scenePlacement: 'EXT',
                                       sceneName: 'Old Baptist Church, Kentucky ',
                                       sceneTime: 'NOON',
                                       shots: 
                                        [ { type: 'shot',
                                            camType: 'LONG SHOT',
                                            camSource: { root: 'BUSH', path: [] },
                                            camTarget: { root: 'MAN', path: [] },
                                            time: { min: 0, sec: 4 },
                                            actions: 
                                             [ { type: 'action',
                                                 lines: 
                                                  [ { text: 'The bush sways in a light breeze.' },
                                                    { text: 'The man paces between them.' } ] } ] } ] } } } ] } ] } } },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'AWAIT',
                      rhs: 
                       { type: 'exp',
                         op: 'TOUCH',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'MAN', path: [] } } } } ] } ] } ] } },
  Unit {
    type: 'unit',
    parent: 
     Unit {
       type: 'unit',
       parent: null,
       decorators: [ { type: 'comment', text: 'comments bla bla' } ],
       scene: 
        { type: 'scene',
          scenePlacement: 'EXT',
          sceneName: 'Old Baptist Church, Kentucky ',
          sceneTime: 'NOON',
          transition: { type: 'transition', transitionType: 'FADE IN' },
          shots: 
           [ { type: 'shot',
               camType: 'EWS',
               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
               time: { sec: 5 },
               actions: 
                [ { type: 'action',
                    lines: 
                     [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.' },
                       { text: 'The man pauses to speak.' } ] },
                  { type: 'dialogue',
                    speaker: 'Old Man',
                    lines: [ { text: 'Hello world?' } ] },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'TOUCH',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'MAN', path: [ 'CAP' ] } } } ],
                    child: 
                     Unit {
                       type: 'unit',
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { type: 'scene',
                          scenePlacement: 'EXT',
                          sceneName: 'Old Baptist Church, Kentucky ',
                          sceneTime: 'NOON',
                          shots: 
                           [ { type: 'shot',
                               camType: 'EWS',
                               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                               time: { sec: 5 },
                               actions: 
                                [ { type: 'action',
                                    lines: 
                                     [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.' },
                                       { text: 'He stops to stroke his beard.' } ] } ] },
                             { type: 'shot',
                               camType: 'CU',
                               camTarget: { root: 'OLD', path: [ 'FACE' ] },
                               time: { min: 0, sec: 4 },
                               actions: 
                                [ { type: 'action',
                                    lines: [ { text: 'We see the old man\\'s white beard.' } ] } ] } ] } } },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'TOUCH',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: 
                             { type: 'selector',
                               root: 'OLD_BAPTIST_CHURCH',
                               path: [ 'FRONT', 'DOOR' ] } } } ],
                    child: 
                     Unit {
                       type: 'unit',
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { type: 'scene',
                          scenePlacement: 'EXT',
                          sceneName: 'Old Baptist Church, Kentucky ',
                          sceneTime: 'NOON',
                          shots: 
                           [ { type: 'shot',
                               camType: 'LONG SHOT',
                               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                               time: { min: 0, sec: 4 },
                               actions: 
                                [ { type: 'action',
                                    lines: [ { text: 'The long church doors tower above a wraparound porch.' } ] },
                                  { type: 'control',
                                    conditions: 
                                     [ { type: 'exp',
                                         op: 'TOUCH',
                                         rhs: 
                                          { type: 'exp',
                                            op: 'EQT',
                                            rhs: { type: 'selector', root: 'BUSH', path: [] } } } ],
                                    child: 
                                     Unit {
                                       type: 'unit',
                                       parent: [Circular],
                                       decorators: [],
                                       scene: 
                                        { type: 'scene',
                                          scenePlacement: 'EXT',
                                          sceneName: 'Old Baptist Church, Kentucky ',
                                          sceneTime: 'NOON',
                                          shots: 
                                           [ { type: 'shot',
                                               camType: 'LONG SHOT',
                                               camSource: { root: 'BUSH', path: [] },
                                               camTarget: { root: 'MAN', path: [] },
                                               time: { min: 0, sec: 4 },
                                               actions: 
                                                [ { type: 'action',
                                                    lines: 
                                                     [ { text: 'The bush sways in a light breeze.' },
                                                       { text: 'The man paces between them.' } ] } ] } ] } } } ] } ] } } },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'AWAIT',
                         rhs: 
                          { type: 'exp',
                            op: 'TOUCH',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'MAN', path: [] } } } } ] } ] } ] } },
    decorators: [],
    scene: 
     { type: 'scene',
       scenePlacement: 'EXT',
       sceneName: 'Old Baptist Church, Kentucky ',
       sceneTime: 'NOON',
       shots: 
        [ { type: 'shot',
            camType: 'EWS',
            camTarget: { root: 'CHURCH', path: [] },
            time: { min: 0, sec: 2 },
            actions: 
             [ { type: 'action',
                 lines: [ { text: 'The man coughs violently.' } ] } ] },
          { type: 'shot',
            camType: 'MEDIUM SHOT',
            camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
            time: { min: 0, sec: 2 },
            actions: 
             [ { type: 'action',
                 lines: [ { text: 'The man wipes his brow and looks up.' } ] },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'AWAIT',
                      rhs: 
                       { type: 'exp',
                         op: 'UP',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'MAN_FOO', path: [] } } } } ] } ] } ] } },
  Unit {
    type: 'unit',
    parent: 
     Unit {
       type: 'unit',
       parent: 
        Unit {
          type: 'unit',
          parent: null,
          decorators: [ { type: 'comment', text: 'comments bla bla' } ],
          scene: 
           { type: 'scene',
             scenePlacement: 'EXT',
             sceneName: 'Old Baptist Church, Kentucky ',
             sceneTime: 'NOON',
             transition: { type: 'transition', transitionType: 'FADE IN' },
             shots: 
              [ { type: 'shot',
                  camType: 'EWS',
                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                  time: { sec: 5 },
                  actions: 
                   [ { type: 'action',
                       lines: 
                        [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.' },
                          { text: 'The man pauses to speak.' } ] },
                     { type: 'dialogue',
                       speaker: 'Old Man',
                       lines: [ { text: 'Hello world?' } ] },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'TOUCH',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'MAN', path: [ 'CAP' ] } } } ],
                       child: 
                        Unit {
                          type: 'unit',
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { type: 'scene',
                             scenePlacement: 'EXT',
                             sceneName: 'Old Baptist Church, Kentucky ',
                             sceneTime: 'NOON',
                             shots: 
                              [ { type: 'shot',
                                  camType: 'EWS',
                                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                  time: { sec: 5 },
                                  actions: 
                                   [ { type: 'action',
                                       lines: 
                                        [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.' },
                                          { text: 'He stops to stroke his beard.' } ] } ] },
                                { type: 'shot',
                                  camType: 'CU',
                                  camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                  time: { min: 0, sec: 4 },
                                  actions: 
                                   [ { type: 'action',
                                       lines: [ { text: 'We see the old man\\'s white beard.' } ] } ] } ] } } },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'TOUCH',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: 
                                { type: 'selector',
                                  root: 'OLD_BAPTIST_CHURCH',
                                  path: [ 'FRONT', 'DOOR' ] } } } ],
                       child: 
                        Unit {
                          type: 'unit',
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { type: 'scene',
                             scenePlacement: 'EXT',
                             sceneName: 'Old Baptist Church, Kentucky ',
                             sceneTime: 'NOON',
                             shots: 
                              [ { type: 'shot',
                                  camType: 'LONG SHOT',
                                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                  time: { min: 0, sec: 4 },
                                  actions: 
                                   [ { type: 'action',
                                       lines: [ { text: 'The long church doors tower above a wraparound porch.' } ] },
                                     { type: 'control',
                                       conditions: 
                                        [ { type: 'exp',
                                            op: 'TOUCH',
                                            rhs: 
                                             { type: 'exp',
                                               op: 'EQT',
                                               rhs: { type: 'selector', root: 'BUSH', path: [] } } } ],
                                       child: 
                                        Unit {
                                          type: 'unit',
                                          parent: [Circular],
                                          decorators: [],
                                          scene: 
                                           { type: 'scene',
                                             scenePlacement: 'EXT',
                                             sceneName: 'Old Baptist Church, Kentucky ',
                                             sceneTime: 'NOON',
                                             shots: 
                                              [ { type: 'shot',
                                                  camType: 'LONG SHOT',
                                                  camSource: { root: 'BUSH', path: [] },
                                                  camTarget: { root: 'MAN', path: [] },
                                                  time: { min: 0, sec: 4 },
                                                  actions: 
                                                   [ { type: 'action',
                                                       lines: 
                                                        [ { text: 'The bush sways in a light breeze.' },
                                                          { text: 'The man paces between them.' } ] } ] } ] } } } ] } ] } } },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'AWAIT',
                            rhs: 
                             { type: 'exp',
                               op: 'TOUCH',
                               rhs: 
                                { type: 'exp',
                                  op: 'EQT',
                                  rhs: { type: 'selector', root: 'MAN', path: [] } } } } ] } ] } ] } },
       decorators: [],
       scene: 
        { type: 'scene',
          scenePlacement: 'EXT',
          sceneName: 'Old Baptist Church, Kentucky ',
          sceneTime: 'NOON',
          shots: 
           [ { type: 'shot',
               camType: 'EWS',
               camTarget: { root: 'CHURCH', path: [] },
               time: { min: 0, sec: 2 },
               actions: 
                [ { type: 'action',
                    lines: [ { text: 'The man coughs violently.' } ] } ] },
             { type: 'shot',
               camType: 'MEDIUM SHOT',
               camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
               time: { min: 0, sec: 2 },
               actions: 
                [ { type: 'action',
                    lines: [ { text: 'The man wipes his brow and looks up.' } ] },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'AWAIT',
                         rhs: 
                          { type: 'exp',
                            op: 'UP',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'MAN_FOO', path: [] } } } } ] } ] } ] } },
    decorators: [],
    scene: 
     { type: 'scene',
       scenePlacement: 'EXT',
       sceneName: 'Old Baptist Church, Kentucky ',
       sceneTime: 'NOON',
       shots: 
        [ { type: 'shot',
            camType: 'MCU',
            camTarget: { root: 'MAN', path: [] },
            time: { min: 0, sec: 2 },
            actions: 
             [ { type: 'action',
                 lines: 
                  [ { text: 'He looks up at us.' },
                    { text: 'The church\\'s cross drapes a shadow over his face.' } ] },
               { type: 'dialogue',
                 speaker: 'Man',
                 lines: [ { text: 'hmph.' } ] },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'UP',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: { type: 'selector', root: 'Man', path: [] } } } ],
                 child: 
                  Unit {
                    type: 'unit',
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { type: 'scene',
                       scenePlacement: 'EXT',
                       sceneName: 'Old Baptist Church, Kentucky ',
                       sceneTime: 'NOON',
                       shots: 
                        [ { type: 'shot',
                            camType: 'LOW ANGLE',
                            camSource: { root: 'MAN', path: [] },
                            camTarget: { root: 'CHURCH', path: [] },
                            time: { min: 0, sec: 2 },
                            actions: 
                             [ { type: 'action',
                                 lines: [ { text: 'We see the silhouette of the cross.' } ] } ] } ] } } },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'AWAIT',
                      rhs: 
                       { type: 'exp',
                         op: 'EQT',
                         rhs: { type: 'selector', root: 'FOO', path: [] } } } ] } ] } ] } },
  Unit {
    type: 'unit',
    parent: 
     Unit {
       type: 'unit',
       parent: 
        Unit {
          type: 'unit',
          parent: 
           Unit {
             type: 'unit',
             parent: null,
             decorators: [ { type: 'comment', text: 'comments bla bla' } ],
             scene: 
              { type: 'scene',
                scenePlacement: 'EXT',
                sceneName: 'Old Baptist Church, Kentucky ',
                sceneTime: 'NOON',
                transition: { type: 'transition', transitionType: 'FADE IN' },
                shots: 
                 [ { type: 'shot',
                     camType: 'EWS',
                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                     time: { sec: 5 },
                     actions: 
                      [ { type: 'action',
                          lines: 
                           [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.' },
                             { text: 'The man pauses to speak.' } ] },
                        { type: 'dialogue',
                          speaker: 'Old Man',
                          lines: [ { text: 'Hello world?' } ] },
                        { type: 'control',
                          conditions: 
                           [ { type: 'exp',
                               op: 'TOUCH',
                               rhs: 
                                { type: 'exp',
                                  op: 'EQT',
                                  rhs: { type: 'selector', root: 'MAN', path: [ 'CAP' ] } } } ],
                          child: 
                           Unit {
                             type: 'unit',
                             parent: [Circular],
                             decorators: [],
                             scene: 
                              { type: 'scene',
                                scenePlacement: 'EXT',
                                sceneName: 'Old Baptist Church, Kentucky ',
                                sceneTime: 'NOON',
                                shots: 
                                 [ { type: 'shot',
                                     camType: 'EWS',
                                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                     time: { sec: 5 },
                                     actions: 
                                      [ { type: 'action',
                                          lines: 
                                           [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.' },
                                             { text: 'He stops to stroke his beard.' } ] } ] },
                                   { type: 'shot',
                                     camType: 'CU',
                                     camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                     time: { min: 0, sec: 4 },
                                     actions: 
                                      [ { type: 'action',
                                          lines: [ { text: 'We see the old man\\'s white beard.' } ] } ] } ] } } },
                        { type: 'control',
                          conditions: 
                           [ { type: 'exp',
                               op: 'TOUCH',
                               rhs: 
                                { type: 'exp',
                                  op: 'EQT',
                                  rhs: 
                                   { type: 'selector',
                                     root: 'OLD_BAPTIST_CHURCH',
                                     path: [ 'FRONT', 'DOOR' ] } } } ],
                          child: 
                           Unit {
                             type: 'unit',
                             parent: [Circular],
                             decorators: [],
                             scene: 
                              { type: 'scene',
                                scenePlacement: 'EXT',
                                sceneName: 'Old Baptist Church, Kentucky ',
                                sceneTime: 'NOON',
                                shots: 
                                 [ { type: 'shot',
                                     camType: 'LONG SHOT',
                                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                     time: { min: 0, sec: 4 },
                                     actions: 
                                      [ { type: 'action',
                                          lines: [ { text: 'The long church doors tower above a wraparound porch.' } ] },
                                        { type: 'control',
                                          conditions: 
                                           [ { type: 'exp',
                                               op: 'TOUCH',
                                               rhs: 
                                                { type: 'exp',
                                                  op: 'EQT',
                                                  rhs: { type: 'selector', root: 'BUSH', path: [] } } } ],
                                          child: 
                                           Unit {
                                             type: 'unit',
                                             parent: [Circular],
                                             decorators: [],
                                             scene: 
                                              { type: 'scene',
                                                scenePlacement: 'EXT',
                                                sceneName: 'Old Baptist Church, Kentucky ',
                                                sceneTime: 'NOON',
                                                shots: 
                                                 [ { type: 'shot',
                                                     camType: 'LONG SHOT',
                                                     camSource: { root: 'BUSH', path: [] },
                                                     camTarget: { root: 'MAN', path: [] },
                                                     time: { min: 0, sec: 4 },
                                                     actions: 
                                                      [ { type: 'action',
                                                          lines: 
                                                           [ { text: 'The bush sways in a light breeze.' },
                                                             { text: 'The man paces between them.' } ] } ] } ] } } } ] } ] } } },
                        { type: 'control',
                          conditions: 
                           [ { type: 'exp',
                               op: 'AWAIT',
                               rhs: 
                                { type: 'exp',
                                  op: 'TOUCH',
                                  rhs: 
                                   { type: 'exp',
                                     op: 'EQT',
                                     rhs: { type: 'selector', root: 'MAN', path: [] } } } } ] } ] } ] } },
          decorators: [],
          scene: 
           { type: 'scene',
             scenePlacement: 'EXT',
             sceneName: 'Old Baptist Church, Kentucky ',
             sceneTime: 'NOON',
             shots: 
              [ { type: 'shot',
                  camType: 'EWS',
                  camTarget: { root: 'CHURCH', path: [] },
                  time: { min: 0, sec: 2 },
                  actions: 
                   [ { type: 'action',
                       lines: [ { text: 'The man coughs violently.' } ] } ] },
                { type: 'shot',
                  camType: 'MEDIUM SHOT',
                  camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
                  time: { min: 0, sec: 2 },
                  actions: 
                   [ { type: 'action',
                       lines: [ { text: 'The man wipes his brow and looks up.' } ] },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'AWAIT',
                            rhs: 
                             { type: 'exp',
                               op: 'UP',
                               rhs: 
                                { type: 'exp',
                                  op: 'EQT',
                                  rhs: { type: 'selector', root: 'MAN_FOO', path: [] } } } } ] } ] } ] } },
       decorators: [],
       scene: 
        { type: 'scene',
          scenePlacement: 'EXT',
          sceneName: 'Old Baptist Church, Kentucky ',
          sceneTime: 'NOON',
          shots: 
           [ { type: 'shot',
               camType: 'MCU',
               camTarget: { root: 'MAN', path: [] },
               time: { min: 0, sec: 2 },
               actions: 
                [ { type: 'action',
                    lines: 
                     [ { text: 'He looks up at us.' },
                       { text: 'The church\\'s cross drapes a shadow over his face.' } ] },
                  { type: 'dialogue',
                    speaker: 'Man',
                    lines: [ { text: 'hmph.' } ] },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'UP',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'Man', path: [] } } } ],
                    child: 
                     Unit {
                       type: 'unit',
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { type: 'scene',
                          scenePlacement: 'EXT',
                          sceneName: 'Old Baptist Church, Kentucky ',
                          sceneTime: 'NOON',
                          shots: 
                           [ { type: 'shot',
                               camType: 'LOW ANGLE',
                               camSource: { root: 'MAN', path: [] },
                               camTarget: { root: 'CHURCH', path: [] },
                               time: { min: 0, sec: 2 },
                               actions: 
                                [ { type: 'action',
                                    lines: [ { text: 'We see the silhouette of the cross.' } ] } ] } ] } } },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'AWAIT',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'FOO', path: [] } } } ] } ] } ] } },
    decorators: [],
    scene: 
     { type: 'scene',
       scenePlacement: 'EXT',
       sceneName: 'Old Baptist Church, Kentucky ',
       sceneTime: 'NOON',
       shots: 
        [ { type: 'shot',
            camType: 'HIGH ANGLE',
            camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
            time: { min: 0, sec: 2 },
            actions: 
             [ { type: 'action',
                 lines: 
                  [ { text: 'He almost looks up but shrugs and huffs.' },
                    { text: 'He kicks a pebble.' } ] },
               { type: 'control',
                 conditions: 
                  [ { type: 'exp',
                      op: 'AWAIT',
                      rhs: 
                       { type: 'exp',
                         op: 'TOUCH',
                         rhs: 
                          { type: 'exp',
                            op: 'EQT',
                            rhs: { type: 'selector', root: 'CHURCH', path: [ 'DOOR' ] } } } } ] } ] } ] } },
  Unit {
    type: 'unit',
    parent: 
     Unit {
       type: 'unit',
       parent: 
        Unit {
          type: 'unit',
          parent: 
           Unit {
             type: 'unit',
             parent: 
              Unit {
                type: 'unit',
                parent: null,
                decorators: [ { type: 'comment', text: 'comments bla bla' } ],
                scene: 
                 { type: 'scene',
                   scenePlacement: 'EXT',
                   sceneName: 'Old Baptist Church, Kentucky ',
                   sceneTime: 'NOON',
                   transition: { type: 'transition', transitionType: 'FADE IN' },
                   shots: 
                    [ { type: 'shot',
                        camType: 'EWS',
                        camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                        time: { sec: 5 },
                        actions: 
                         [ { type: 'action',
                             lines: 
                              [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.' },
                                { text: 'The man pauses to speak.' } ] },
                           { type: 'dialogue',
                             speaker: 'Old Man',
                             lines: [ { text: 'Hello world?' } ] },
                           { type: 'control',
                             conditions: 
                              [ { type: 'exp',
                                  op: 'TOUCH',
                                  rhs: 
                                   { type: 'exp',
                                     op: 'EQT',
                                     rhs: { type: 'selector', root: 'MAN', path: [ 'CAP' ] } } } ],
                             child: 
                              Unit {
                                type: 'unit',
                                parent: [Circular],
                                decorators: [],
                                scene: 
                                 { type: 'scene',
                                   scenePlacement: 'EXT',
                                   sceneName: 'Old Baptist Church, Kentucky ',
                                   sceneTime: 'NOON',
                                   shots: 
                                    [ { type: 'shot',
                                        camType: 'EWS',
                                        camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                        time: { sec: 5 },
                                        actions: 
                                         [ { type: 'action',
                                             lines: 
                                              [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.' },
                                                { text: 'He stops to stroke his beard.' } ] } ] },
                                      { type: 'shot',
                                        camType: 'CU',
                                        camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                        time: { min: 0, sec: 4 },
                                        actions: 
                                         [ { type: 'action',
                                             lines: [ { text: 'We see the old man\\'s white beard.' } ] } ] } ] } } },
                           { type: 'control',
                             conditions: 
                              [ { type: 'exp',
                                  op: 'TOUCH',
                                  rhs: 
                                   { type: 'exp',
                                     op: 'EQT',
                                     rhs: 
                                      { type: 'selector',
                                        root: 'OLD_BAPTIST_CHURCH',
                                        path: [ 'FRONT', 'DOOR' ] } } } ],
                             child: 
                              Unit {
                                type: 'unit',
                                parent: [Circular],
                                decorators: [],
                                scene: 
                                 { type: 'scene',
                                   scenePlacement: 'EXT',
                                   sceneName: 'Old Baptist Church, Kentucky ',
                                   sceneTime: 'NOON',
                                   shots: 
                                    [ { type: 'shot',
                                        camType: 'LONG SHOT',
                                        camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                        time: { min: 0, sec: 4 },
                                        actions: 
                                         [ { type: 'action',
                                             lines: [ { text: 'The long church doors tower above a wraparound porch.' } ] },
                                           { type: 'control',
                                             conditions: 
                                              [ { type: 'exp',
                                                  op: 'TOUCH',
                                                  rhs: 
                                                   { type: 'exp',
                                                     op: 'EQT',
                                                     rhs: { type: 'selector', root: 'BUSH', path: [] } } } ],
                                             child: 
                                              Unit {
                                                type: 'unit',
                                                parent: [Circular],
                                                decorators: [],
                                                scene: 
                                                 { type: 'scene',
                                                   scenePlacement: 'EXT',
                                                   sceneName: 'Old Baptist Church, Kentucky ',
                                                   sceneTime: 'NOON',
                                                   shots: 
                                                    [ { type: 'shot',
                                                        camType: 'LONG SHOT',
                                                        camSource: { root: 'BUSH', path: [] },
                                                        camTarget: { root: 'MAN', path: [] },
                                                        time: { min: 0, sec: 4 },
                                                        actions: 
                                                         [ { type: 'action',
                                                             lines: 
                                                              [ { text: 'The bush sways in a light breeze.' },
                                                                { text: 'The man paces between them.' } ] } ] } ] } } } ] } ] } } },
                           { type: 'control',
                             conditions: 
                              [ { type: 'exp',
                                  op: 'AWAIT',
                                  rhs: 
                                   { type: 'exp',
                                     op: 'TOUCH',
                                     rhs: 
                                      { type: 'exp',
                                        op: 'EQT',
                                        rhs: { type: 'selector', root: 'MAN', path: [] } } } } ] } ] } ] } },
             decorators: [],
             scene: 
              { type: 'scene',
                scenePlacement: 'EXT',
                sceneName: 'Old Baptist Church, Kentucky ',
                sceneTime: 'NOON',
                shots: 
                 [ { type: 'shot',
                     camType: 'EWS',
                     camTarget: { root: 'CHURCH', path: [] },
                     time: { min: 0, sec: 2 },
                     actions: 
                      [ { type: 'action',
                          lines: [ { text: 'The man coughs violently.' } ] } ] },
                   { type: 'shot',
                     camType: 'MEDIUM SHOT',
                     camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
                     time: { min: 0, sec: 2 },
                     actions: 
                      [ { type: 'action',
                          lines: [ { text: 'The man wipes his brow and looks up.' } ] },
                        { type: 'control',
                          conditions: 
                           [ { type: 'exp',
                               op: 'AWAIT',
                               rhs: 
                                { type: 'exp',
                                  op: 'UP',
                                  rhs: 
                                   { type: 'exp',
                                     op: 'EQT',
                                     rhs: { type: 'selector', root: 'MAN_FOO', path: [] } } } } ] } ] } ] } },
          decorators: [],
          scene: 
           { type: 'scene',
             scenePlacement: 'EXT',
             sceneName: 'Old Baptist Church, Kentucky ',
             sceneTime: 'NOON',
             shots: 
              [ { type: 'shot',
                  camType: 'MCU',
                  camTarget: { root: 'MAN', path: [] },
                  time: { min: 0, sec: 2 },
                  actions: 
                   [ { type: 'action',
                       lines: 
                        [ { text: 'He looks up at us.' },
                          { text: 'The church\\'s cross drapes a shadow over his face.' } ] },
                     { type: 'dialogue',
                       speaker: 'Man',
                       lines: [ { text: 'hmph.' } ] },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'UP',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'Man', path: [] } } } ],
                       child: 
                        Unit {
                          type: 'unit',
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { type: 'scene',
                             scenePlacement: 'EXT',
                             sceneName: 'Old Baptist Church, Kentucky ',
                             sceneTime: 'NOON',
                             shots: 
                              [ { type: 'shot',
                                  camType: 'LOW ANGLE',
                                  camSource: { root: 'MAN', path: [] },
                                  camTarget: { root: 'CHURCH', path: [] },
                                  time: { min: 0, sec: 2 },
                                  actions: 
                                   [ { type: 'action',
                                       lines: [ { text: 'We see the silhouette of the cross.' } ] } ] } ] } } },
                     { type: 'control',
                       conditions: 
                        [ { type: 'exp',
                            op: 'AWAIT',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'FOO', path: [] } } } ] } ] } ] } },
       decorators: [],
       scene: 
        { type: 'scene',
          scenePlacement: 'EXT',
          sceneName: 'Old Baptist Church, Kentucky ',
          sceneTime: 'NOON',
          shots: 
           [ { type: 'shot',
               camType: 'HIGH ANGLE',
               camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
               time: { min: 0, sec: 2 },
               actions: 
                [ { type: 'action',
                    lines: 
                     [ { text: 'He almost looks up but shrugs and huffs.' },
                       { text: 'He kicks a pebble.' } ] },
                  { type: 'control',
                    conditions: 
                     [ { type: 'exp',
                         op: 'AWAIT',
                         rhs: 
                          { type: 'exp',
                            op: 'TOUCH',
                            rhs: 
                             { type: 'exp',
                               op: 'EQT',
                               rhs: { type: 'selector', root: 'CHURCH', path: [ 'DOOR' ] } } } } ] } ] } ] } },
    decorators: [],
    scene: 
     { type: 'scene',
       scenePlacement: 'EXT',
       sceneName: 'Old Baptist Church, Kentucky ',
       sceneTime: 'NOON',
       shots: 
        [ { type: 'shot',
            camType: 'FULL',
            camSource: { root: 'CHURCH', path: [ 'DOOR' ] },
            camMovement: 'EASE IN',
            time: { min: 0, sec: 5 },
            actions: 
             [ { type: 'action',
                 lines: [ { text: 'We ease into the sanctuary.' } ] } ] } ] } } ]
`
