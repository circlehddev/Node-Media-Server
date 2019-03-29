const NodeMediaServer = require('../node_media_server');
const axios = require('axios');
// eslint-disable-next-line import/no-unresolved
const conf = require('./config');

const config = {
  logType: conf.debug ? 4 : 1,
  rtmp: {
    port: 1935,
    chunk_size: 100000,
    gop_cache: false,
    ping: 60,
    ping_timeout: 30
  },
  http: {
    port: conf.http_port,
    allow_origin: '*',
    mediaroot: './media'
  },
  guaclive: {
    api_endpoint: conf.endpoint,
    ignore_auth: !!conf.ignore_auth
  }
};

if (conf.https_port) {
  config.https = {
    port: conf.https_port,
    cert: conf.https_cert,
    key: conf.https_key
  };
}

if (conf.ffmpeg_path) {
  const tasks = [
    {
      app: 'live',
      ac: 'libopus',
      hls: true,
      hlsFlags: '[hls_time=1:hls_list_size=3600:hls_flags=delete_segments]'
      // 2(h) * 60 * 60 / 2(s) = 3600 大体2時間ぐらいおっかけ再生できるようにする
    }
  ];

  config.trans = {
    ffmpeg: conf.ffmpeg_path,
    tasks
  };
}

const nms = new NodeMediaServer(config);
nms.run();

nms.on('prePublish', (id, StreamPath, args) => {

});

nms.on('donePublish', (id, StreamPath, args) => {
    axios.post(
        `${config.guaclive.api_endpoint}/live/publishDone`,
        `name=${args.token}&tcUrl=${StreamPath}`, {
        maxRedirects: 0,
        validateStatus: function (status){
          // Bypass redirect
          return status == 304 || (status >= 200 && status < 300);
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
      // eslint-disable-next-line no-console
      console.log('[donePublish]', response);
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.log('[donePublish]', error);
    });
});