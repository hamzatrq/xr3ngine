import { BlendFunction } from './blending/BlendFunction';
import { Effect, EffectAttribute } from './Effect';
import fragmentShader from './glsl/depth/shader.frag';

/**
 * A depth visualization effect.
 *
 * Useful for debugging.
 */

export class DepthEffect extends Effect {
  defines: any;
  /**
	 * Constructs a new depth effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Boolean} [options.inverted=false] - Whether the depth values should be inverted.
	 */

  constructor ({ blendFunction = BlendFunction.NORMAL, inverted = false } = {}) {
    super('DepthEffect', fragmentShader, {

      blendFunction,
      attributes: EffectAttribute.DEPTH

    });

    this.inverted = inverted;
  }

  /**
	 * Indicates whether depth should be inverted.
	 *
	 * @type {Boolean}
	 */

  get inverted () {
    return (this as any).defines.has('INVERTED');
  }

  /**
	 * Enables or disables depth inversion.
	 *
	 * @type {Boolean}
	 */

  set inverted (value) {
    if (this.inverted !== value) {
      if (value) {
        (this as any).defines.set('INVERTED', '1');
      } else {
        (this as any).defines.delete('INVERTED');
      }

      this.setChanged();
    }
  }
}
