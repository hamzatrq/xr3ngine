/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @author          wassname
 * @description
 * Describes human class which holds the 3d mesh, modifiers, human factors,
 * and morphTargets.
 */

import _ from "lodash"
import * as qs from "qs"
import TWEEN from "tween"
import { deepParseFloat, deepRoundValues, remapKeyValuesDeep } from "../../../common/functions/MakeHumanHelpers"
import poses from "../../json/poses/poses.json"
import { EthnicSkinBlender } from "./EthnicSkinBlender"
import Factors from "../Factors"
import Modifiers from "./Modifier"
import { ExportOBJ } from "../../../assets/exporters/OBJExporter"
import { Proxies } from "./Proxy"
import Targets from "./Targets"
import { Object3D, Material, Quaternion, LoadingManager, MaterialLoader, FileLoader, LoaderUtils, Mesh, Geometry, MeshBasicMaterial, SkinnedMesh, MultiMaterial, Vector3, Matrix4 } from "three"

export class HumanIO {
  human: any
  rounding: number
  shortenMapping: any
  constructor(human) {
    this.human = human

    this.rounding = 3

    const modifierFullNames = Object.keys(this.human.modifiers.children).sort()
    const modifierFullNameMapping = _.fromPairs(_.map(modifierFullNames, (k, v) => [k, v]))
    this.shortenMapping = { poseName: "pn", skin: "s", modifiers: "m", proxies: "p", ...modifierFullNameMapping }
  }

  toConfig() {
    return this.human.exportConfig()
  }

  fromConfig(config) {
    this.human.importConfig(config)
  }

  toShortConfig(config = this.human.exportConfig()) {
    config = remapKeyValuesDeep(config, this.shortenMapping, {})
    config = deepRoundValues(config, v => _.round(v, this.rounding))
    return config
  }

  fromShortConfig(sortConfig) {
    return remapKeyValuesDeep(sortConfig, _.invert(this.shortenMapping), {})
  }

  fromUrlQuery(queryConfig) {
    const config = qs.parse(queryConfig)
    return deepParseFloat(remapKeyValuesDeep(config, _.invert(this.shortenMapping), {}))
  }

  /* transforms the config to a smaller url query **/
  toUrlQuery(config = this.human.exportConfig(), encode = true) {
    config = remapKeyValuesDeep(config, this.shortenMapping, {})
    config = deepRoundValues(config, v => _.round(v, this.rounding))
    const queryConfig = qs.stringify(config, { encode })
    if (queryConfig.length < 2048) throw new Error("url config should be shorter than 2048 chars")
    return queryConfig
  }

  toUrl(config = this.human.exportConfig(), encode = true) {
    return `${window.location.origin}?${this.toUrlQuery(config, encode)}`
  }

  fromUrl(url = window.location.toString()) {
    const parser = document.createElement("a")
    parser.href = url
    const config = this.fromUrlQuery(parser.search.slice(1))
    this.human.importConfig(config)
    return config
  }

  /**
   * Export the human mesh with morphs but not pose, skin, or accessories.
   * @param {bool} helpers - if true it strips the helper meshes like hair-helper.
   * @return {string} Wavefront obj file compatible with blender
   */
  toObj(helpers = false) {
    // const this = this
    const mesh = this.human.mesh.clone()
    mesh.geometry = mesh.geometry.clone()

    mesh.name = `makehuman_1.1-${new Date().toJSON()}`

    // unmask vertices under clothes
    const nullMaterial = mesh.material.materials.findIndex(m => m.name == "maskedFaces")
    mesh.geometry.faces.forEach((f, i) => {
      if (f.materialIndex === nullMaterial) {
        f.materialIndex = this.human.mesh.geometry.faces[i].oldMaterialIndex
      }
    })

    if (!helpers) {
      /* Makehuman has a human body mesh, then it has some invisible meshes attached to it.
       * These are hair-helper, dress-helpers etc which invisible extensions to the human body
       * used to attach clothes or hair to. When the human is morphed so are the helpers,
       * ensuring that the clothes fit the morphed human.
       * If the helper option is not selected, lets remove the helper vertices.
       */
      const geom = mesh.geometry

      // delete unused, uvs, faces, and vertices
      geom.faceVertexUvs = geom.faceVertexUvs.filter((uv, i) => geom.faces[i].materialIndex === 0)
      geom.faces = geom.faces.filter(f => f.materialIndex === 0)

      // TODO remove unused vertices without breaking the obj
      const verticesToKeep = _.sortBy(
        _.uniq(_.concat(geom.faces.filter(f => f.materialIndex === 0).map(f => [f.a, f.b, f.c])))
      )
      geom.vertices = geom.vertices.filter((v, i) => verticesToKeep.includes(i))
      geom.faces.forEach(f => {
        f.a = verticesToKeep.indexOf(f.a)
        f.b = verticesToKeep.indexOf(f.b)
        f.c = verticesToKeep.indexOf(f.c)
      })
    }

    let obj = ExportOBJ(mesh)
    // don't export vertex normals
    obj = obj
      .split("\n")
      .filter(line => !line.startsWith("vn "))
      .join("\n")

    // header data
    const jsonMetadata = JSON.stringify(this.human.metadata, null, 4).replace(/\n/g, "\n#")
    const header = `# Exported from makehuman js on ${new Date().toJSON()}\n#Source metadata:\n#${jsonMetadata}\n`

    return header + obj
  }
}

/**
 * Basic human with method to load base mash, skins, and config
 * @type {Class}
 */
export class BaseHuman extends Object3D {
  config: any
  mesh: any
  skins: any[]
  poses: any
  minUpdateInterval: number
  _poseTweens: any[]
  _skinCache: {}
  manager: LoadingManager
  materialLoader: MaterialLoader
  loader: any
  metadata: any
  texturePath: boolean
  geometry: any
  skeleton: any
  targets: any
  _poseName: any
  /**
   * @param  {Object[]} config [description]
   * @param  {String} config[].x - X position
   * @param  {String} config[].y - Y position
   * @param  {String} config[].y - Z position
   * @param  {String} config[].skins - Url to skins
   * @param  {String} config[].character - Url to body json suitable for json
   *                                     loader
   * @param  {String} config[].baseUrl - Baseurl
   */
  constructor(config) {
    super()

    this.config = config = _.defaults(config, {
      skins: [],
      proxies: [],
      poses: [],
      targets: "targets.bin",
      model: "base.json",
      baseUrl: "data/",
      x: 0,
      y: 0,
      z: 0,
      s: 1
    })

    this.mesh = null
    this.skins = []

    this.poses = poses

    // TODO put in config
    this.minUpdateInterval = 1000 // minimum interval to recalc vertices in ms

    // TODO undo this hardcoding
    // this.skeleton_metadata = skeleton_metadata

    this._poseTweens = []
    this._skinCache = {}

    // this.mixer = new AnimationMixer(this);

    this.manager = new LoadingManager()
    this.manager.onLoad = this.onLoadComplete.bind(this)
    this.materialLoader = new MaterialLoader(this.manager)

    // this.onBeforeRender = BaseHuman.prototype.onBeforeRender
    // this.onAfterRender = BaseHuman.prototype.onAfterRender
  }

  /**
   * Loads body from config
   * @return {Promise}                - promise of loaded human
   */
  loadModel() {
    const config = this.config

    // HUMAN
    // Load the geometry data from a url
    this.loader = new FileLoader(this.manager)
    const modelUrl = `${config.baseUrl}models/${config.model}`
    return (
      new Promise((resolve, reject) => {
        try {
          this.loader.load(modelUrl, resolve, undefined, reject)
        } catch (e) {
          reject(e)
        }
      })
        .catch(err => {
          console.error("Failed to load model data", modelUrl, err)
          throw err
        })
        .then((text: string) => JSON.parse(text))
        .then(json => {
          this.metadata = json.metadata
          const texturePath =
            this.texturePath && typeof this.texturePath === "string"
              ? this.texturePath
              : LoaderUtils.extractUrlBase(modelUrl)

          return new this.loader.load(texturePath)
        })
        // use unpacking here to turn one args into two, as promises only return one
        .then((out: Mesh) => {
          const { geometry, material } = out
          this.geometry = geometry as Geometry

          const materials = material as Material[]

          geometry.computeBoundingBox()
          // geometry.computeVertexNormals()
          geometry.name = config.character

          materials.map((m: any) => (m.morphTargets = true))
          materials.map((m: any) => (m.skinning = true))

          // add a null material, and backup face materialIndexes
          this.geometry.faces.map(face => (face.oldMaterialIndex = face.materialIndex))
          materials.push(new MeshBasicMaterial({ visible: false, name: "maskedFaces" }))

          // load multiple materials, to group helper faces using materials http://stackoverflow.com/questions/11025307/can-i-hide-faces-of-a-mesh-in-three-js
          this.mesh = new SkinnedMesh(geometry, new MultiMaterial(materials))
          this.mesh.name = config.character
          this.add(this.mesh)

          this.skeleton = this.mesh.skeleton

          this.scale.set(config.s, config.s, config.s)

          this.mesh.geometry.computeBoundingBox()
          const halfHeight = this.mesh.geometry.boundingBox.getSize().y / 2
          this.position.set(config.x, config.y + halfHeight, config.z)

          this.mesh.castShadow = true
          this.mesh.receiveShadow = true

          this.mesh.geometry.computeVertexNormals()

          this.updateJointPositions()

          // hide the helper parts
          // this.bodyPartOpacity(0)
          return this.setSkin(config.defaultSkin).then(() => this)
        })
    )
  }

  /**
   * Load targets from .target urls
   * @param  {String}      dataUrl    Url of the targt binary
   * @return {Promise}                Promise of an array of targets
   */
  loadTargets(dataUrl = this.config.baseUrl + "targets/" + this.config.targets) {
    return this.targets.load(dataUrl).then(targets => targets)
  }

  onLoadComplete() {
    console.log("Load complete")
  }

  /**
   * This sets the opacity of parts of the body.
   * With name given arguments it sets all helpers and joints
   * If no arguments are given it lists helper names.
   * @param  {Number} opacity - Set opacity of the helper/s to this
   * @param  {String} name    - Optional helper, otherwise all helpers are set
   * @return {Number}         - Amount of helper opacities set
   */
  bodyPartOpacity(opacity, name) {
    let parts

    // return lists of parts
    if (opacity === undefined) {
      return this.mesh.material.materials.map(m => m.name)
    }

    const helpersAndJoints = this.mesh.material.materials.filter(
      m => typeof m.name === "string" && (m.name.startsWith("joint") || m.name.startsWith("helper"))
    )

    if (name) {
      parts = this.mesh.material.materials.filter(m => m.name === name)
    } else {
      parts = helpersAndJoints
    }
    for (let i = 0; i < parts.length; i++) {
      // no point in rendering it at 0 opacity
      if (opacity === 0) {
        parts[i].visible = false
      } else {
        parts[i].visible = true
      }
      parts[i].opacity = opacity
      parts[i].transparent = opacity < 1
    }
    return parts.length
  }

  /** Set this bodies texture map from a loaded skin material **/
  setSkin(url = this.config.defaultSkin) {
    const base = `${this.config.baseUrl}skins/`
    if (!url.startsWith(base)) {
      url = `${this.config.baseUrl}skins/${url}`
    }
    return Promise.resolve()
      .then(() => {
        if (this._skinCache[url]) {
          return this._skinCache[url]
        } else {
          return new Promise((resolve, reject) => {
            this.loader.load(url, resolve, undefined, reject)
          })
            .then((text: string) => {
              const json = JSON.parse(text)
              const texturePath =
                this.texturePath && typeof this.texturePath === "string"
                  ? this.texturePath
                  : LoaderUtils.extractUrlBase(url)
              return new this.loader.load(texturePath)
            })
            .then(material => {
              this._skinCache[url] = material
              material.name = url
                .split("/")
                .slice(-1)[0]
                .split(".")[0]
              material.skinning = true
              return material
            })
        }
      })
      .then(material => {
        if (this.mesh && this.mesh.material.materials) {
          return (this.mesh.material.materials[0] = material)
        } else {
          return false
        }
      })
  }

  /**
   *  Calculate the position of specified named joint from the current
   *  state of the human mesh. If this skeleton contains no vertex mapping
   *  for that joint name, it falls back to looking for a vertex group in the
   *  human basemesh with that joint name.
   * @type {String} - bone name e.g. head
   */
  getJointPosition(boneName, head = false) {
    // TODO if inRest then get geom, else buffer geom
    if (boneName && boneName.indexOf("____head") === -1 && boneName.indexOf("____tail") === -1) {
      boneName += head ? "____head" : "____tail"
    }
    // let bone_id = _.findIndex(this.skeleton.bones, bone=>bone.name==boneName)
    const vertices = this.metadata.joint_pos_idxs[boneName]
    if (vertices) {
      const positions = vertices.map(vId => this.mesh.geometry.vertices[vId].clone())

      return new Vector3(
        _.mean(positions.map(v => v.x)),
        _.mean(positions.map(v => v.y)),
        _.mean(positions.map(v => v.z))
      )
    } else {
      return null
    }
  }

  /**
   * We move bones towards the vertices they are weighted to, adjusting for
   * change in mesh size
   * See makehumans shared/skeleton.py:Skeleton:updateJointPositions
   */
  updateJointPositions() {
    const skeleton = this.skeleton
    const identity = new Matrix4().identity()

    // undo pose, while we do this
    const poseName = this._poseName
    this.setPose(poseName)

    // get positions of reference vertices
    // first get positions of bones, as we don't want changes to propogate to the mesh then to the skeleton
    const positions = skeleton.bones.map(bone => {
      const vTail = this.getJointPosition(bone.name, false)
      const vHead = this.getJointPosition(bone.parent.name, false)
      if (vTail && vHead) {
        return vTail.clone().sub(vHead)
      }
      if (vTail) {
        return vTail
      } else {
        console.warn(
          `couldn't update ${bone.name} because no weights or group for ${vTail ? bone.name : bone.parent.name}`
        )
        return null
      }
    })

    // now update referenceMatrix
    for (let i = 0; i < skeleton.bones.length; i++) {
      const boneInverse = new Matrix4()
      const bone = skeleton.bones[i]
      const parentIndex = _.findIndex(skeleton.bones, b => (b as any).name === bone.parent.name)
      const parent = skeleton.bones[parentIndex]
      const position = positions[i]

      if (position) {
        bone.position.set(position.x, position.y, position.z)
        bone.updateMatrixWorld()

        if (i > 0) {
          boneInverse.getInverse(parent.matrixWorld).multiply(bone.matrixWorld)
          // subtract parents
          for (let j = 0; j < boneInverse.elements.length; j++) {
            boneInverse.elements[j] =
              skeleton.boneInverses[parentIndex].elements[j] - boneInverse.elements[j] + identity.elements[j]
          }
        } else {
          boneInverse.getInverse(bone.matrixWorld).multiply(this.matrixWorld)
        }

        // TODO make into test, it shouldn't change boneInverses on initial load with no pose
        // let diffs =_.zipWith(
        //     boneInverse.elements,
        //     this.mesh.skeleton.boneInverses[i].elements,
        //     (a,b)=>a-b
        // )
        // console.assert(
        //     diffs.filter(d=>d>0.001) .length==0,'in pose position these should be equal '+bone.name+' '+diffs
        // )
        skeleton.boneInverses[i] = boneInverse
      }
    }
    // FIXME there should be a way of doing this without actually changing bone positions, the rePosing but it works for now
    this.setPose(poseName)
  }

  setPose(poseName, interval = 0) {
    // TODO, load each from json like a proxy
    const pose = this.poses[poseName]
    if (pose) {
      this._poseName = poseName
      this._poseTweens.map(tween => {
        return tween ? tween.stop() : ""
      })
      this._poseTweens = Object.keys(pose).map(boneName => {
        const bone = this.mesh.skeleton.bones.find(b => b.name === boneName)
        if (!bone) {
          console.error("couldnt find bone", boneName)
          return null
        }
        // Tween the pose
        const data = pose[bone.name]
        if (!interval) {
          // skip the tween at interval zero
          // we apply the rotation to the one above it (the head), since it modifies the one after
          bone.parent.quaternion.set(...data)
          return null
        } else {
          const qBefore = bone.parent.quaternion.clone()
          const qAfter = bone.parent.quaternion.set(...data)
          const t = 0
          return new TWEEN.Tween(t)
            .to(1, interval)
            .onUpdate(ti => {
              Quaternion.slerp(qBefore, qAfter, bone.parent.quaternion, ti)
            })
            .start()
        }
      })
    } else {
      this.mesh.pose()
      this._poseName = null
    }
    // this.updateHeight()
  }

  exportConfig() {
    // consider doing bodyPartOpacity, consider using this.toJSON
    // also consifer exporting config althoug we might need to reload human then
    const json = {
      skin: this.mesh.material.materials[0].name,
      poseName: this._poseName
    }
    return json
  }

  importConfig(json) {
    if (json.skin) {
      this.setSkin(json.skin)
    }
    if (json.poseName) {
      this.setPose(json.poseName)
    }
  }
}

/**
 * Extends BaseHuman to have targets and modifiers to manage them
 */
export class Human extends BaseHuman {
  bodyZones: string[]
  modifiers: Modifiers
  factors: Factors
  proxies: Proxies
  ethnicSkinBlender: EthnicSkinBlender
  io: HumanIO
  constructor(config) {
    super(config)

    // const
    // Store age in the age modifier instead
    this.bodyZones = [
      "l-eye",
      "r-eye",
      "jaw",
      "nose",
      "mouth",
      "head",
      "neck",
      "torso",
      "hip",
      "pelvis",
      "r-upperarm",
      "l-upperarm",
      "r-lowerarm",
      "l-lowerarm",
      "l-hand",
      "r-hand",
      "r-upperleg",
      "l-upperleg",
      "r-lowerleg",
      "l-lowerleg",
      "l-foot",
      "r-foot",
      "ear"
    ]

    // flags
    // this.hasWarpTargets = false // not used yet

    // a modular container for modifiers such as age, left-arm length etc
    this.modifiers = new Modifiers(this)

    // a modular object with human factors and their getters and setters,
    //  e.g. age, weight, ageInYears
    this.factors = new Factors()

    // holds loaded targets, target metadata, and target related methods
    this.targets = new Targets(this)

    this.proxies = new Proxies(this)
    this.add(this.proxies)

    this.ethnicSkinBlender = new EthnicSkinBlender(this)

    this.io = new HumanIO(this)
  }

  updateHeight() {
    // TODO update position, by reading bone world position, or buffer geom?
    // let position = this.mesh.geometry._bufferGeometry.attributes.position.array
    // let ys=[]
    // for (let i=0;i<position.length;i+=3){
    //     ys.push(position[i])
    // }
    // let miny = _.min(ys)
    // this.position.y=miny
    //
    // Use joint ground, get face group that corresponds, then get vertices for the faces, then get mean y?
    // no the ground join is just between the feet, it doesn't seem to help us
  }

  updateSkinColor() {
    const defaultSkin = this._skinCache["data/skins/young_caucasian_female/young_caucasian_female.json"]
    if (defaultSkin) {
      return (defaultSkin.color = this.ethnicSkinBlender.valueOf())
    } else {
      return false
    }
  }

  /** Call when vertices/element change **/
  onElementsNeedUpdate() {
    // super.onElementsNeedUpdate()
    this.updateJointPositions()
    this.proxies.onElementsNeedUpdate()
    this.updateSkinColor()
    this.mesh.geometry.computeVertexNormals()
  }

  /** Call before render **/
  onBeforeRender() {
    TWEEN.update()
    this.targets.applyTargets()
    if (this.mesh && this.mesh.geometry.elementsNeedUpdate) {
      this.onElementsNeedUpdate()
    }
  }

  exportConfig() {
    // TODO, no need to export modifiers with default values or skin etc
    const json = super.exportConfig()
    json["proxies"] = this.proxies.exportConfig()
    json["modifiers"] = this.modifiers.exportConfig()
    return json
  }

  importConfig(json) {
    // json = _.defaults(json, { modifiers: [], proxies: [] })
    super.importConfig(json)
    if (json.proxies) this.proxies.importConfig(json.proxies)
    if (json.modifiers) this.modifiers.importConfig(json.modifiers)
  }
}

// export var human = new Human();
export default Human
