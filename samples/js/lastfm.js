'use strict';

class LastFm {
	constructor() {
		utils.CreateFolder(Paths.data);
		this.json_file = Paths.data + 'lastfm.json';
		this.api_key = '';
		this.username = ''
		this.ua = 'javascript_panelLastFm';
		this.read_file();
		this.image_urls = [];
	}

	base_url () {
		return 'http://ws.audioscrobbler.com/2.0/?format=json&api_key=' + this.api_key;
	}

	extract_urls (obj) {
		if (typeof obj === 'object') {
			for (let key in obj) {
				this.extract_urls(obj[key]);
			}
		} else {
			if (obj.startsWith("https://lastfm.freetls.fastly.net/i/u/avatar170s/")) {
				this.image_urls.push(obj.replace('avatar170s/', ''));
			}
		}
	}

	download_images (response_text, filename_base, limit) {
		var json = window.himalaya.parse(response_text);

		this.image_urls = [];
		this.extract_urls(json);

		_(this.image_urls)
			.map((image_url) => {
				return {
					url : image_url,
					filename : filename_base + image_url.substring(image_url.lastIndexOf('/') + 1) + '.jpg'
				};
			})
			.filter((item) => {
				return !utils.IsFile(item.filename);
			})
			.take(limit)
			.forEach((item) => {
				utils.DownloadFileAsync(item.url, item.filename);
			});
	}

	notify_data (name, data) {
		if (name == '2K3.NOTIFY.LASTFM') {
			this.read_file();

			_.forEach(panel.list_objects, (item) => {
				if (item.name == 'lastfm_info') {
					item.reset();
				}
			});

			_.forEach(panel.text_objects, (item) => {
				if (item.name == 'lastfm_bio') {
					item.reset();
					item.refresh();
				}
			});
		}
	}

	read_file () {
		const obj = JsonParseFile(this.json_file);
		this.api_key = obj.api_key || '';
		this.username = obj.username || '';
	}

	update_api_key () {
		const api_key = utils.InputBox('Enter your Last.fm API key', window.Name, this.api_key);

		if (api_key != this.api_key) {
			this.api_key = api_key;
			this.write_file();
			window.NotifyOthers('2K3.NOTIFY.LASTFM', 'update');
			this.notify_data('2K3.NOTIFY.LASTFM', 'update');
		}
	}

	update_username () {
		const username = utils.InputBox('Enter your Last.fm username', window.Name, this.username);

		if (username != this.username) {
			this.username = username;
			this.write_file();
			window.NotifyOthers('2K3.NOTIFY.LASTFM', 'update');
			this.notify_data('2K3.NOTIFY.LASTFM', 'update');
		}
	}

	write_file = function () {
		const str = JSON.stringify({
			username : this.username,
			api_key : this.api_key,
		});

		utils.WriteTextFile(this.json_file, str);
	}
}
