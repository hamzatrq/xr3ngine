import { RGBAFormat, RGBFormat, ImageLoader, ImageBitmapLoader, Texture, Loader, LoadingManager } from 'three';
import { isWebWorker } from '../../../common/functions/getEnvironment';

export class TextureLoader extends Loader {
	crossOrigin: any;
	path: any;
	manager: any;

	constructor(manager?: LoadingManager) {
    super(manager)
  }

	load ( url, onLoad, onProgress, onError ) {
		const texture = new Texture();
		const loader = new (isWebWorker ? ImageBitmapLoader : ImageLoader)( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );
    if(isWebWorker) {
      //@ts-ignore
      loader.setOptions( { imageOrientation: 'flipY' } );
    }
		loader.load( url, ( image ) => {
			texture.image = image;
			// JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
			const isJPEG = url.search( /\.jpe?g($|\?)/i ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;
			texture.format = isJPEG ? RGBFormat : RGBAFormat;
			texture.needsUpdate = true;
			if ( onLoad !== undefined ) {
				onLoad( texture );
			}
		}, onProgress, onError );
		return texture;
	}
}