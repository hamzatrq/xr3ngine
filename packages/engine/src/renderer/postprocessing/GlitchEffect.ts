import {
  NearestFilter,
  RepeatWrapping,
  RGBFormat,
  Uniform,
  Vector2
} from 'three';

import { NoiseTexture } from './images/textures/NoiseTexture';
import { BlendFunction } from './blending/BlendFunction';
import { Effect } from './Effect';
import fragmentShader from './glsl/glitch/shader.frag';

/**
 * A label for generated data textures.
 *
 * @type {String}
 * @private
 */

const tag = 'Glitch.Generated';

/**
 * Returns a random float in the specified range.
 *
 * @private
 * @param {Number} low - The lowest possible value.
 * @param {Number} high - The highest possible value.
 * @return {Number} The random value.
 */

function randomFloat (low, high) {
  return low + Math.random() * (high - low);
}

/**
 * A glitch effect.
 *
 * This effect can influence the {@link ChromaticAberrationEffect}.
 *
 * Reference: https://github.com/staffantan/unityglitch
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

export class GlitchEffect extends Effect {
  delay: Vector2;
  duration: Vector2;
  breakPoint: Vector2;
  time: number;
  seed: any;
  distortion: any;
  mode: number;
  strength: Vector2;
  ratio: number;
  chromaticAberrationOffset: any;
  /**
	 * Constructs a new glitch effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Vector2} [options.chromaticAberrationOffset] - A chromatic aberration offset. If provided, the glitch effect will influence this offset.
	 * @param {Vector2} [options.delay] - The minimum and maximum delay between glitch activations in seconds.
	 * @param {Vector2} [options.duration] - The minimum and maximum duration of a glitch in seconds.
	 * @param {Vector2} [options.strength] - The strength of weak and strong glitches.
	 * @param {Texture} [options.perturbationMap] - A perturbation map. If none is provided, a noise texture will be created.
	 * @param {Number} [options.dtSize=64] - The size of the generated noise map. Will be ignored if a perturbation map is provided.
	 * @param {Number} [options.columns=0.05] - The scale of the blocky glitch columns.
	 * @param {Number} [options.ratio=0.85] - The threshold for strong glitches.
	 */

  constructor ({
    blendFunction = BlendFunction.NORMAL,
    chromaticAberrationOffset = null,
    delay = new Vector2(1.5, 3.5),
    duration = new Vector2(0.6, 1.0),
    strength = new Vector2(0.3, 1.0),
    columns = 0.05,
    ratio = 0.85,
    perturbationMap = null,
    dtSize = 64
  } = {}) {
    super('GlitchEffect', fragmentShader, {

      blendFunction,

      uniforms: new Map([
        ['perturbationMap', new Uniform(null)],
        ['columns', new Uniform(columns)],
        ['active', new Uniform(false)],
        ['random', new Uniform(1.0)],
        ['seed', new Uniform(new Vector2())],
        ['distortion', new Uniform(new Vector2())]
      ])

    });

    this.setPerturbationMap((perturbationMap === null)
      ? this.generatePerturbationMap(dtSize)
      : perturbationMap
    );

    /**
		 * The minimum and maximum delay between glitch activations in seconds.
		 *
		 * @type {Vector2}
		 */

    this.delay = delay;

    /**
		 * The minimum and maximum duration of a glitch in seconds.
		 *
		 * @type {Vector2}
		 */

    this.duration = duration;

    /**
		 * A random glitch break point.
		 *
		 * @type {Number}
		 * @private
		 */

    this.breakPoint = new Vector2(
      randomFloat(this.delay.x, this.delay.y),
      randomFloat(this.duration.x, this.duration.y)
    );

    /**
		 * A time accumulator.
		 *
		 * @type {Number}
		 * @private
		 */

    this.time = 0;

    /**
		 * Random seeds.
		 *
		 * @type {Vector2}
		 * @private
		 */

    this.seed = (this as any).uniforms.get('seed').value;

    /**
		 * A distortion vector.
		 *
		 * @type {Vector2}
		 * @private
		 */

    this.distortion = (this as any).uniforms.get('distortion').value;

    /**
		 * The effect mode.
		 *
		 * @type {GlitchMode}
		 */

    this.mode = GlitchMode.SPORADIC;

    /**
		 * The strength of weak and strong glitches.
		 *
		 * @type {Vector2}
		 */

    this.strength = strength;

    /**
		 * The threshold for strong glitches, ranging from 0 to 1 where 0 means no
		 * weak glitches and 1 means no strong ones. The default ratio of 0.85
		 * offers a decent balance.
		 *
		 * @type {Number}
		 */

    this.ratio = ratio;

    /**
		 * The chromatic aberration offset.
		 *
		 * @type {Vector2}
		 */

    this.chromaticAberrationOffset = chromaticAberrationOffset;
  }

  /**
	 * Indicates whether the glitch effect is currently active.
	 *
	 * @type {Boolean}
	 */

  get active () {
    return (this as any).uniforms.get('active').value;
  }

  /**
	 * Returns the current perturbation map.
	 *
	 * @return {Texture} The current perturbation map.
	 */

  getPerturbationMap () {
    return (this as any).uniforms.get('perturbationMap').value;
  }

  /**
	 * Replaces the current perturbation map with the given one.
	 *
	 * The current map will be disposed if it was generated by this effect.
	 *
	 * @param {Texture} map - The new perturbation map.
	 */

  setPerturbationMap (map) {
    const currentMap = this.getPerturbationMap();

    if (currentMap !== null && currentMap.name === tag) {
      currentMap.dispose();
    }

    map.minFilter = map.magFilter = NearestFilter;
    map.wrapS = map.wrapT = RepeatWrapping;
    map.generateMipmaps = false;

    (this as any).uniforms.get('perturbationMap').value = map;
  }

  /**
	 * Generates a perturbation map.
	 *
	 * @param {Number} [size=64] - The texture size.
	 * @return {DataTexture} The perturbation map.
	 */

  generatePerturbationMap (size = 64) {
    const map = new NoiseTexture(size, size, RGBFormat);
    (map as any).name = tag;

    return map;
  }

  /**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 */

  update (renderer, inputBuffer, deltaTime) {
    const mode = this.mode;
    const breakPoint = this.breakPoint;
    const offset = this.chromaticAberrationOffset;
    const s = this.strength;

    let time = this.time;
    let active = false;
    let r = 0.0; let a = 0.0;
    let trigger;

    if (mode !== GlitchMode.DISABLED) {
      if (mode === GlitchMode.SPORADIC) {
        time += deltaTime;
        trigger = (time > breakPoint.x);

        if (time >= (breakPoint.x + breakPoint.y)) {
          breakPoint.set(
            randomFloat(this.delay.x, this.delay.y),
            randomFloat(this.duration.x, this.duration.y)
          );

          time = 0;
        }
      }

      r = Math.random();
      (this as any).uniforms.get('random').value = r;

      if ((trigger && r > this.ratio) || mode === GlitchMode.CONSTANT_WILD) {
        active = true;

        r *= s.y * 0.03;
        a = randomFloat(-Math.PI, Math.PI);

        this.seed.set(randomFloat(-s.y, s.y), randomFloat(-s.y, s.y));
        this.distortion.set(randomFloat(0.0, 1.0), randomFloat(0.0, 1.0));
      } else if (trigger || mode === GlitchMode.CONSTANT_MILD) {
        active = true;

        r *= s.x * 0.03;
        a = randomFloat(-Math.PI, Math.PI);

        this.seed.set(randomFloat(-s.x, s.x), randomFloat(-s.x, s.x));
        this.distortion.set(randomFloat(0.0, 1.0), randomFloat(0.0, 1.0));
      }

      this.time = time;
    }

    if (offset !== null) {
      if (active) {
        offset.set(Math.cos(a), Math.sin(a)).multiplyScalar(r);
      } else {
        offset.set(0.0, 0.0);
      }
    }

    (this as any).uniforms.get('active').value = active;
  }
}

/**
 * A glitch mode enumeration.
 *
 * @type {Object}
 * @property {Number} DISABLED - No glitches.
 * @property {Number} SPORADIC - Sporadic glitches.
 * @property {Number} CONSTANT_MILD - Constant mild glitches.
 * @property {Number} CONSTANT_WILD - Constant wild glitches.
 */

export const GlitchMode = {

  DISABLED: 0,
  SPORADIC: 1,
  CONSTANT_MILD: 2,
  CONSTANT_WILD: 3

};
