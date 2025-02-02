import { ShaderMaterial, Uniform, Vector2 } from 'three';
import fragmentShader from './glsl/outline/shader.frag';
import vertexShader from './glsl/outline/shader.vert';

/**
 * An outline shader material.
 */

export class OutlineMaterial extends ShaderMaterial {
  /**
	 * Constructs a new outline material.
	 *
	 * @param {Vector2} [texelSize] - The screen texel size.
	 */

  constructor (texelSize = new Vector2()) {
    super({

      type: 'OutlineMaterial',

      uniforms: {
        inputBuffer: new Uniform(null),
        texelSize: new Uniform(new Vector2())
      },

      fragmentShader,
      vertexShader,

      depthWrite: false,
      depthTest: false

    } as any);

    /** @ignore */
    (this as any).toneMapped = false;

    this.setTexelSize(texelSize.x, texelSize.y);

    // @todo Added for backward compatibility.
    (this as any).uniforms.maskTexture = (this as any).uniforms.inputBuffer;
  }

  /**
	 * Sets the texel size.
	 *
	 * @param {Number} x - The texel width.
	 * @param {Number} y - The texel height.
	 */

  setTexelSize (x, y) {
    (this as any).uniforms.texelSize.value.set(x, y);
  }
}

/**
 * An outline shader material.
 *
 * @deprecated Use OutlineMaterial instead.
 */

export const OutlineEdgesMaterial = OutlineMaterial;
