import {
  AssetContainer,
  Camera,
  Scene,
  SceneLoader,
  Vector3,
  Animation,
  AnimationGroup,
  Nullable,
  PowerEase,
  ArcRotateCamera,
  Behavior,
  FollowCamera,
} from '@babylonjs/core'

enum ViewStatus {
  UNPLAYED,
  PLAYING,
  BACKGROUND,
  DONE,
}

export class ImprovScene {
  // babylon scene to add to and remove assetContainers
  _babylonMainScene: Scene

  _camera: Camera

  // babylon scene's assets
  public BabylonSceneAssetContainer: AssetContainer

  // this scene's name
  private _improvSceneName: string
  // all loaded scees
  public static readonly AllScenes: { [sceneName: string]: ImprovScene } = {}
  // all states
  public static readonly AllMarkers: { [markerName: string]: boolean } = {}

  static readonly MAX_LINKED_SCENES: number = 6
  private _linkedSceneNames: string[]
  IsActive: boolean

  public constructor(babylonMainScene: Scene, improvSceneName: string) {
    this._babylonMainScene = babylonMainScene
    this._camera = babylonMainScene.getCameraByName('MainCamera')
    this._improvSceneName = improvSceneName
    ImprovScene.AllScenes[improvSceneName] = this
  }

  protected gotoScript(scriptName: string): void {
    // reset goto path since the scene is loading
    let newScene = ImprovScene.AllScenes[scriptName]
    newScene.loadSceneAssets().then(() => {
      this.IsActive = false

      // find scenes to unload
      let activeScenes = [this._improvSceneName, ...this._linkedSceneNames]

      // find scenes to deactivate and and unload
      for (let sceneName in ImprovScene.AllScenes) {
        let sceneToUnload = ImprovScene.AllScenes[sceneName]
        if (activeScenes.indexOf(sceneToUnload._improvSceneName) === -1) {
          sceneToUnload.unload()
        }
      }
    })
  }

  private async loadSceneAssets(
    loadDepth: number = 1,
    loadLinkedScenes: boolean = true,
  ): Promise<AssetContainer> {
    // load asset container
    let container = await SceneLoader.LoadAssetContainerAsync(
      './',
      this._improvSceneName,
      this._babylonMainScene,
    )
    // add all asset to existing scene
    container.addAllToScene()

    // LinkedScenes
    this.BabylonSceneAssetContainer = container

    // load linked scenes
    if (loadLinkedScenes) {
      for (let sceneName of this._linkedSceneNames) {
        let linkedScene = ImprovScene.AllScenes[sceneName]
        linkedScene.loadSceneAssets(loadDepth - 1, false)
      }
    }

    return container
  }

  private unload() {
    this.IsActive = false
    this.BabylonSceneAssetContainer.dispose()
  }

  protected isSelected(subjectName: string): boolean {
    const pick = this._babylonMainScene.pick(
      this._babylonMainScene.pointerX,
      this._babylonMainScene.pointerY,
      undefined,
      false,
    )
    return pick.pickedMesh.name == subjectName
  }

  _viewStatuses: { [viewName: string]: ViewStatus } = {}

  protected playView(
    viewType: number,
    viewDuration: number,
    cameraMovementType: string,
    cameraFOV: number,
    cameraFromMeshName: string,
    cameraLookAtName: string,
    cameraLoopMode: number,
    onDone: any,
  ): ViewStatus {
    let status = this._viewStatuses[viewType]
    if (status !== ViewStatus.PLAYING) {
      status = ViewStatus.PLAYING
      this._viewStatuses[viewType] = status
      this._activeView = viewType
      this._camera.fov = cameraFOV
      const fps = 60
      const totalFrame = viewDuration / fps
      let cameraFrom = this._babylonMainScene.getTransformNodeByName(
        cameraFromMeshName,
      ).position
      let cameraLookAtMesh = this._babylonMainScene.getMeshByName(
        cameraLookAtName,
      )

      var camera = new FollowCamera(
        'FollowCam',
        cameraFrom,
        this._babylonMainScene,
        cameraLookAtMesh,
      )
      // The goal distance of camera from target
      camera.radius = 30
      // The goal height of camera above local origin (centre) of target
      camera.heightOffset = 10
      // The goal rotation of camera around local origin (centre) of target in x y plane
      camera.rotationOffset = 0
      // Acceleration of camera in moving from current to goal position
      camera.cameraAcceleration = 0.005
      // The speed at which acceleration is halted
      camera.maxCameraSpeed = 10
      // This attaches the camera to the canvas
      camera.attachControl(true)

      //TODO: Movement
      /*
      let cameraTo = cameraMovementType === 'ZOOM' : cameraFrom 
      let anim = Animation.CreateAndStartAnimation(
        'animation', // name
        this._camera, // node
        'position', // target property
        fps, // frames per second
        totalFrame, // total frame
        cameraFrom, // from
        cameraTo, // to
        cameraLoopMode, // loop mode
        new PowerEase(cameraEasing), // easing function
        () => {
          // on complete
          this._viewStatuses[viewType] = ViewStatus.DONE
          onDone()
        },
      )
      */
      return status
    }
  }

  protected playTransition(
    transitionType: string,
    transitionDuration: number,
    fromViewId: number,
    toViewId: number,
  ) {
    //CUT support switching active camera
    if (transitionType == 'CUT') {
      this._activeView = toViewId
      //change camera position
      //this._camera
    }
    //TODO: fade in/out
  }

  protected playAction(
    actionName: string,
    isLooping: boolean = false,
    nextActionName: string = '',
  ): Nullable<AnimationGroup> {
    let animationGroup: Nullable<AnimationGroup> = this._babylonMainScene.getAnimationGroupByName(
      actionName,
    )
    if (animationGroup?.isPlaying == false) {
      //set the nextAction
      animationGroup.onAnimationEndObservable.add((eventData, eventState) => {
        
      })
      animationGroup.play(isLooping)
    }
    return animationGroup
  }

  getScenePath(sceneName: string): string {
    return `./${sceneName}`
  }

  setMarker(markerName: string) {
    ImprovScene.AllMarkers[markerName] = true
  }

  unsetMarker(markerName: string) {
    ImprovScene.AllMarkers[markerName] = false
  }

  // for scene logic
  runSceneLogic(): void {}
}
