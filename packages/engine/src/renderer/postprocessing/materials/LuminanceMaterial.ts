import { ShaderMaterial, Uniform, Vector2 } from 'three';
import fragmentShader from './glsl/luminance/shader.frag';
import vertexShader from './glsl/common/shader.vert';

/**
 * A luminance shader material.
 *
 * This shader produces a greyscale luminance map that describes the absolute
 * amount of light emitted by a scene. It can also be configured to output
 * colours that are scaled with their respective luminance value. Additionally,
 * a range may be provided to mask out undesired texels.
 *
 * The alpha channel always contains the luminance value.
 *
 * On luminance coefficients:
 *  http://www.poynton.com/notes/colour_and_gamma/ColorFAQ.html#RTFToC9
 *
 * Coefficients for different colour spaces:
 *  https://hsto.org/getpro/habr/post_images/2ab/69d/084/2ab69d084f9a597e032624bcd74d57a7.png
 *
 * Luminance range reference:
 *  https://cycling74.com/2007/05/23/your-first-shader/#.Vty9FfkrL4Z
 */

export class LuminanceMaterial extends ShaderMaterial {
  /**
	 * Constructs a new luminance material.
	 *
	 * @param {Boolean} [colorOutput=false] - Defines whether the shader should output colors scaled with their luminance value.
	 * @param {Vector2} [luminanceRange] - If provided, the shader will mask out texels that aren't in the specified luminance range.
	 */

  constructor (colorOutput = false, luminanceRange = null) {
    const useRange = (luminanceRange !== null);

    super({

      type: 'LuminanceMaterial',

      uniforms: {
        inputBuffer: new Uniform(null),
        threshold: new Uniform(0.0),
        smoothing: new Uniform(1.0),
        range: new Uniform(useRange ? luminanceRange : new Vector2())
      },

      fragmentShader,
      vertexShader,

      depthWrite: false,
      depthTest: false

    } as any);

    /** @ignore */
    (this as any).toneMapped = false;

    this.colorOutput = colorOutput;
    this.useThreshold = true;
    this.useRange = useRange;
  }

  /**
	 * The luminance threshold.
	 *
	 * @type {Number}
	 */

  get threshold () {
    return (this as any).uniforms.threshold.value;
  }

  /**
	 * Sets the luminance threshold.
	 *
	 * @type {Number}
	 */

  set threshold (value) {
    (this as any).uniforms.threshold.value = value;
  }

  /**
	 * The luminance threshold smoothing.
	 *
	 * @type {Number}
	 */

  get smoothing () {
    return (this as any).uniforms.smoothing.value;
  }

  /**
	 * Sets the luminance threshold smoothing.
	 *
	 * @type {Number}
	 */

  set smoothing (value) {
    (this as any).uniforms.smoothing.value = value;
  }

  /**
	 * Indicates whether the luminance threshold is enabled.
	 *
	 * @type {Boolean}
	 */

  get useThreshold () {
    return ((this as any).defines.THRESHOLD !== undefined);
  }

  /**
	 * Enables or disables the luminance threshold.
	 *
	 * @type {Boolean}
	 */

  set useThreshold (value) {
    if (value) {
      (this as any).defines.THRESHOLD = '1';
    } else {
      delete (this as any).defines.THRESHOLD;
    }

    (this as any).needsUpdate = true;
  }

  /**
	 * Indicates whether color output is enabled.
	 *
	 * @type {Boolean}
	 */

  get colorOutput () {
    return ((this as any).defines.COLOR !== undefined);
  }

  /**
	 * Enables or disables color output.
	 *
	 * @type {Boolean}
	 */

  set colorOutput (value) {
    if (value) {
      (this as any).defines.COLOR = '1';
    } else {
      delete (this as any).defines.COLOR;
    }

    (this as any).needsUpdate = true;
  }

  /**
	 * Enables or disables color output.
	 *
	 * @deprecated Use colorOutput instead.
	 * @param {Boolean} enabled - Whether color output should be enabled.
	 */

  setColorOutputEnabled (enabled) {
    this.colorOutput = enabled;
  }

  /**
	 * Indicates whether luminance masking is enabled.
	 *
	 * @type {Boolean}
	 */

  get useRange () {
    return ((this as any).defines.RANGE !== undefined);
  }

  /**
	 * Enables or disables luminance masking.
	 *
	 * If enabled, the threshold will be ignored.
	 *
	 * @type {Boolean}
	 */

  set useRange (value) {
    if (value) {
      (this as any).defines.RANGE = '1';
    } else {
      delete (this as any).defines.RANGE;
    }

    (this as any).needsUpdate = true;
  }

  /**
	 * Indicates whether luminance masking is enabled.
	 *
	 * @type {Boolean}
	 * @deprecated Use useRange instead.
	 */

  get luminanceRange () {
    return this.useRange;
  }

  /**
	 * Enables or disables luminance masking.
	 *
	 * @type {Boolean}
	 * @deprecated Use useRange instead.
	 */

  set luminanceRange (value) {
    this.useRange = value;
  }

  /**
	 * Enables or disables the luminance mask.
	 *
	 * @deprecated Use luminanceRange instead.
	 * @param {Boolean} enabled - Whether the luminance mask should be enabled.
	 */

  setLuminanceRangeEnabled (enabled) {
    this.useRange = enabled;
  }
}
