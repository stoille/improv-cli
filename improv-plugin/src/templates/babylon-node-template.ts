import { ImprovScene } from '../../src/improv/improv-scene'
import { Node } from '@babylonjs/core/node'
import { Scene, SceneLoader } from '@babylonjs/core'
import { visibleInInspector, VisiblityPropertyType } from './decorators'

class scene_SceneClassName extends ImprovScene {
  constructor(babylonMainScene: Scene, improvSceneName: string) {
    super(babylonMainScene, improvSceneName)
  }

  runSceneLogic(): void {
    const pick = this._babylonMainScene.pick(
      this._babylonMainScene.pointerX,
      this._babylonMainScene.pointerY,
      undefined,
      false,
    )
	let pickMeshName = null
    if (pick?.hit) {
      pickMeshName = pick.pickedMesh.name
    }
    '@REPLACE WITH SCENE LOGIC@'
  }
}

export default class SceneClassName extends Node {
  _improvScene: scene_SceneClassName

  //game objects that the scene logic acts on
  '@REPLACE WITH VARIABLE LIST@'

  /**
   * Override constructor.
   * @warn do not fill.
   */
  // @ts-ignore ignoring the super call as we don't want to re-init
  protected constructor() {}

  /**
   * Called on the node is being initialized.
   * This function is called immediatly after the constructor has been called.
   */
  public onInitialize(): void {
    this._improvScene = new scene_SceneClassName(this._scene, 'SceneClassName')
	//load all meshses
	SceneLoader.ImportMeshAsync(['@REPLACE WITH LOAD MESH LIST@'], "assets/root/", "root.babylon");
  }

  /**
   * Called on the scene starts.
   */
  public onStart(): void {
    // ...
  }

  /**
   * Called each frame.
   */
  public onUpdate(): void {
    if (this._improvScene.IsActive) {
      this._improvScene.runSceneLogic()
    }
  }

  /**
   * Called on the object has been disposed.
   * Object can be disposed manually or when the editor stops running the scene.
   */
  public onStop(): void {
    // ...
  }

  /**
   * Called on a message has been received and sent from a graph.
   * @param message defines the name of the message sent from the graph.
   * @param data defines the data sent in the message.
   * @param sender defines the reference to the graph class that sent the message.
   */
  public onMessage(name: string, data: any, sender: any): void {
    switch (name) {
      case 'myMessage':
        // Do something...
        break
    }
  }
}
