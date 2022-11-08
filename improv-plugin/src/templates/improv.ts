import {
  AssetContainer,
  AssetsManager,
  Camera,
  Scene,
  Mesh,
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

export namespace improv {
  export interface IActionLine {
    text: string
    duration: number
  }

  export interface IAction {
    id: number
    lines: IActionLine[]
    looping: boolean
  }

  export interface ITransition {
    type: string
    duration: number
    fromViewId: number
    toViewId: number
  }

  export interface IView {
    id: number
    type: string
    duration: number
    cameraMovementType: string|null
    cameraFOV: number
    cameraFromId: string
    cameraLookAtId: string
    cameraLooping: boolean
  }

  export interface IEntity {
    objectMeshes: Mesh[]
    views: IView[]
    actions: IAction[]
    playScript: () => void
  }

  export enum ViewStatus {
    UNPLAYED,
    PLAYING,
    BACKGROUND,
    DONE,
  }

  export enum TransitionStatus {
    UNPLAYED,
    PLAYING,
    DONE,
  }

  interface AssetContainerRef {
    count: number
    container: AssetContainer
  }

  export const AssetLocation: string = 'https://models.babylonjs.com/'

  // babylon main scene to add to and remove assetContainers
  export var _babylonMainScene: Scene

  export var _camera: Nullable<Camera>

  //babylon's assets loader
  export var AssetsManager: AssetsManager

  export var LoadedScripts: {
    [id: string]: IEntity
  } = {}
  // all loaded scenes
  export var LoadedAssetContainers: {
    [sceneName: string]: AssetContainerRef
  } = {}
  // all states
  export var AllMarkers: { [markerName: string]: boolean } = {}

  export var _viewStatuses: { [viewName: string]: ViewStatus } = {}

  export var CurrentScript: IEntity
  export var CurrentViewIdx: number
  export function GetNextView() {
    return CurrentScript.views[CurrentViewIdx + 1]
  }

  export function decreaseRefsAndUnloadIfNeeded(entity: any) {
    for (let sceneNameToUnload of entity._referencedScenes) {
      let assetRef = improv.LoadedAssetContainers[sceneNameToUnload]
      assetRef.count -= 1
      //TODO: more granular control over unloading individual unreferenced objects
      if (assetRef.count <= 0) {
        assetRef.container.removeAllFromScene()
      }
    }
  }

  export function loadSceneAssets(entity: any) {
    improv.LoadedScripts[entity._name] = entity
    for (let sceneName of entity._referencedScenes) {
      if (improv.LoadedAssetContainers.hasOwnProperty(sceneName)) {
        improv.LoadedAssetContainers[sceneName].count += 1
      } else {
        let task = improv.AssetsManager.addContainerTask(
          `${sceneName} task`,
          '',
          improv.AssetLocation,
          `${sceneName}.glb`,
        )
        task.onSuccess = (task) => {
          const container = task.loadedContainer
          improv.LoadedAssetContainers[sceneName] = {
            count: 1,
            container,
          }
          container.addToScene(
            (entity) => entity._objectNamesToLoad.findIndex(entity.name) > -1,
          )
        }
      }
    }
  }

  export function isSelected(subject: Mesh): boolean {
    const pick = improv._babylonMainScene.pick(
      improv._babylonMainScene.pointerX,
      improv._babylonMainScene.pointerY,
      undefined,
      false,
    )
    return pick.pickedMesh == subject
  }

  export function playView(
    entity: IView,
    onUpdate: () => void,
    transition: () => TransitionStatus,
    nextPlayView: any,
    cameraLooping: boolean = false,
  ): ViewStatus {
    let viewId = getViewId(
      entity.type,
      entity.cameraFromId,
      entity.cameraLookAtId,
    )
    let status = this._viewStatuses[viewId]
    if (status !== ViewStatus.PLAYING) {
      this._viewStatuses[viewId] = ViewStatus.PLAYING
      improv._camera.fov = entity.cameraFOV
      const fps = 60
      const totalFrame = entity.duration / fps
      let cameraFrom = improv._babylonMainScene.getTransformNodeByName(
        entity.cameraFromId,
      ).position
      let cameraLookAtMesh = improv._babylonMainScene.getMeshByName(
        entity.cameraLookAtId,
      )

      var camera = new FollowCamera(
        'FollowCam',
        cameraFrom,
        improv._babylonMainScene,
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

      //TODO: Movement based on cameraMovementType
      let cameraTo = cameraFrom //zoom: improv._babylonMainScene.getTransformNodeByName(cameraLookAtId).position
      let cameraEasing = 1.0 //TODO: movement based on movemenet type
      let anim = Animation.CreateAndStartAnimation(
        'animation', // name
        improv._camera, // node
        'position', // target property
        fps, // frames per second
        totalFrame, // total frame
        cameraFrom, // from
        cameraTo, // to
        cameraLooping ? 0 : 1, // loop mode
        new PowerEase(cameraEasing), // easing function
        () => {
          // on complete
          nextPlayView()
          transition()
        },
      )
    } else if (status == ViewStatus.PLAYING) {
      onUpdate()
    }
    return status
  }

  export function playTransition(transition: ITransition) : TransitionStatus {
    //TODO: make CUT support switching active camera depend on transition type
    //if (transition.type == 'CUT') {
    this._viewStatuses[transition.fromViewId] = ViewStatus.DONE
    this._viewStatuses[transition.toViewId] = ViewStatus.PLAYING
    //change camera position
    //improv._camera
	//TODO: fade in/out
	return TransitionStatus.DONE
  }

  export function playAction(
    action: improv.IAction,
    onDone: () => void,
  ): Nullable<AnimationGroup> {
    let animationGroup: Nullable<AnimationGroup> = improv._babylonMainScene.getAnimationGroupByName(
      action.id,
    )
    if (animationGroup?.isPlaying == false) {
      //set the nextAction
      animationGroup.onAnimationEndObservable.add((eventData, eventState) => {
        onDone()
      })
      animationGroup.play(action.looping)
    }

    return animationGroup
  }

  export function getScenePath(sceneName: string): string {
    return `./${sceneName}`
  }

  export function setMarker(markerName: string) {
    improv.AllMarkers[markerName] = true
  }

  export function removeMarker(markerName: string) {
    improv.AllMarkers[markerName] = false
  }

  export function getViewId(
    viewType: string,
    cameraFromId: string,
    cameraLookAtId: string,
  ) {
    return `${viewType}_${cameraFromId}_${cameraLookAtId}`
  }
}
