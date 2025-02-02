import { Cache, Loader } from 'three';
import fetch from "cross-fetch"

if(process.env.NODE_ENV !== "production")
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = "0"

const loading = {};

function FileLoader(manager) {

	Loader.call(this, manager);

}

FileLoader.prototype = Object.assign(Object.create(Loader.prototype), {

	constructor: FileLoader,

	load: function (url, onLoad, onProgress, onError) {

		if (url === undefined) url = '';

		if (this.path !== undefined) url = this.path + url;

		url = this.manager.resolveURL(url);

		const scope = this;

		const cached = Cache.get(url);

		if (cached !== undefined) {

			scope.manager.itemStart(url);

			setTimeout(function () {

				if (onLoad) onLoad(cached);

				scope.manager.itemEnd(url);

			}, 0);

			return cached;

		}

		// Check if request is duplicate

		if (loading[url] !== undefined) {

			loading[url].push({

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			});

			return;

		}

		// Check for data: URI
		const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
		const dataUriRegexResult = url.match(dataUriRegex);

		// Safari can not handle Data URIs through XMLHttpRequest so process manually
		if (dataUriRegexResult) {

			const mimeType = dataUriRegexResult[1];
			const isBase64 = !!dataUriRegexResult[2];

			let data = dataUriRegexResult[3];
			data = decodeURIComponent(data);

			if (isBase64) data = atob(data);

			try {

				let response;
				const responseType = (this.responseType || '').toLowerCase();

				switch (responseType) {

					case 'arraybuffer':
					case 'blob':

						const view = new Uint8Array(data.length);

						for (let i = 0; i < data.length; i++) {

							view[i] = data.charCodeAt(i);

						}

						if (responseType === 'blob') {

							response = new Blob([view.buffer], { type: mimeType });

						} else {

							response = view.buffer;

						}

						break;

					case 'document':

						const parser = new DOMParser();
						response = parser.parseFromString(data, mimeType);

						break;

					case 'json':

						response = JSON.parse(data);

						break;

					default: // 'text' or other

						response = data;

						break;

				}

				// Wait for next browser tick like standard XMLHttpRequest event dispatching does
				setTimeout(function () {

					if (onLoad) onLoad(response);

					scope.manager.itemEnd(url);

				}, 0);

			} catch (error) {

				// Wait for next browser tick like standard XMLHttpRequest event dispatching does
				setTimeout(function () {

					if (onError) onError(error);

					scope.manager.itemError(url);
					scope.manager.itemEnd(url);

				}, 0);

			}

		} else {

			// Initialise array for duplicate requests

			loading[url] = [];

			loading[url].push({

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			});


			fetch(url).then(res => res.blob()).then(async (res) => {
				// console.log("***************** URL IS", url);
				const response = await res.arrayBuffer();

				const callbacks = loading[url];
				scope.manager.itemStart(url);

				delete loading[url];

				// console.log("********* FileLoader LOADED")
				// console.log(res);

				// Some browsers return HTTP Status 0 when using non-http protocol
				// e.g. 'file://' or 'data://'. Handle as success.

				if (res.status === 0) console.warn('THREE.FileLoader: HTTP Status 0 received.');

				// Add to cache only on HTTP success, so that we do not cache
				// error response bodies as proper responses to requests.
				Cache.add(url, res);

				for (let i = 0, il = callbacks.length; i < il; i++) {
					// console.log("*************** CALLBACK")

					const callback = callbacks[i];
					if (callback.onLoad) callback.onLoad(response);

				}

				scope.manager.itemEnd(url);
			}).catch((event) => {
				const callbacks = loading[url];

				delete loading[url];

				for (let i = 0, il = callbacks.length; i < il; i++) {

					const callback = callbacks[i];
					if (callback.onError) callback.onError(event);

				}

				scope.manager.itemError(url);
				scope.manager.itemEnd(url);
			});
		}
	},

	setResponseType: function (value) {

		this.responseType = value;
		return this;

	},

	setMimeType: function (value) {

		this.mimeType = value;
		return this;

	}

});


export { FileLoader };
