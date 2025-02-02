import { ShaderMaterial, Uniform } from 'three';
import { ColorChannel } from '../core/ColorChannel';
import fragmentShader from './glsl/mask/shader.frag';
import vertexShader from './glsl/common/shader.vert';

/**
 * A mask shader material.
 *
 * This material applies a mask texture to a buffer.
 */

export class MaskMaterial extends ShaderMaterial {
  /**
	 * Constructs a new mask material.
	 *
	 * @param {Texture} [maskTexture] - The mask texture.
	 */

  constructor (maskTexture = null) {
    super({

      type: 'MaskMaterial',

      uniforms: {
        maskTexture: new Uniform(maskTexture),
        inputBuffer: new Uniform(null),
        strength: new Uniform(1.0)
      },

      fragmentShader,
      vertexShader,

      depthWrite: false,
      depthTest: false

    } as any);

    /** @ignore */
    (this as any).toneMapped = false;

    this.colorChannel = ColorChannel.RED;
    this.maskFunction = MaskFunction.DISCARD;
  }

  /**
	 * Sets the mask texture.
	 *
	 * @type {Texture}
	 */

  set maskTexture (value) {
    (this as any).uniforms.maskTexture.value = value;
  }

  /**
	 * Sets the color channel to use for masking.
	 *
	 * The default channel is `RED`.
	 *
	 * @type {ColorChannel}
	 */

  set colorChannel (value) {
    (this as any).defines.COLOR_CHANNEL = value.toFixed(0);
    (this as any).needsUpdate = true;
  }

  /**
	 * Sets the masking technique.
	 *
	 * The default function is `DISCARD`.
	 *
	 * @type {MaskFunction}
	 */

  set maskFunction (value) {
    (this as any).defines.MASK_FUNCTION = value.toFixed(0);
    (this as any).needsUpdate = true;
  }

  /**
	 * Indicates whether the masking is inverted.
	 *
	 * @type {Boolean}
	 */

  get inverted () {
    return ((this as any).defines.INVERTED !== undefined);
  }

  /**
	 * Determines whether the masking should be inverted.
	 *
	 * @type {Boolean}
	 */

  set inverted (value) {
    if (this.inverted && !value) {
      delete (this as any).defines.INVERTED;
    } else if (value) {
      (this as any).defines.INVERTED = '1';
    }

    (this as any).needsUpdate = true;
  }

  /**
	 * The current mask strength.
	 *
	 * Individual mask values will be clamped to [0.0, 1.0].
	 *
	 * @type {Number}
	 */

  get strength () {
    return (this as any).uniforms.strength.value;
  }

  /**
	 * Sets the strength of the mask.
	 *
	 * Has no effect when the mask function is set to `DISCARD`.
	 *
	 * @type {Number}
	 */

  set strength (value) {
    (this as any).uniforms.strength.value = value;
  }
}

/**
 * A mask function enumeration.
 *
 * @type {Object}
 * @property {Number} DISCARD - Discards elements when the respective mask value is zero.
 * @property {Number} MULTIPLY - Multiplies the input buffer with the mask texture.
 * @property {Number} MULTIPLY_RGB_SET_ALPHA - Multiplies the input RGB values with the mask and sets alpha to the mask value.
 */

export const MaskFunction = {

  DISCARD: 0,
  MULTIPLY: 1,
  MULTIPLY_RGB_SET_ALPHA: 2

};
