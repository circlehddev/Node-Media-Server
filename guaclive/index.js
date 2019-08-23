const NodeMediaServer = require('../node_media_server');
const axios = require('axios');
const cron = require('node-cron')
// eslint-disable-next-line import/no-unresolved
const helpers = require('./utils/helpers');
const conf = require('./config');

const config = {
  logType: conf.debug ? 4 : 2,
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
    ignore_auth: !!conf.ignore_auth, 
    maxDataRate: conf.maxDataRate || 8000
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
      hlsFlags: 'hls_time=1:hls_list_size=5:hls_flags=delete_segments'
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

nms.on('onMetaData', (id, metadata) => {
  console.log('onMetaData', id, metadata);
  let session = nms.getSession(id);
  if(metadata.videodatarate > config.guaclive.maxDataRate){
    session.sendStatusMessage(
      session.publishStreamId,
      'error',
      'NetStream.Publish.Rejected',
      `Bitrate too high, ${Math.round(Math.floor(metadata.videodatarate))}/${config.guaclive.maxDataRate} kbps (max).`
    );
    return session.reject();
  }
});

nms.on('postPublish', (id, StreamPath, args) => {
  let session = nms.getSession(id)
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // Create a thumbnail
  try{
    helpers.generateStreamThumbnail(session.publishStreamPath);
  }catch(e){
  }

  // Generate a thumbnail every 60 seconds
  try{
    let task = cron.schedule('* * * * *', () => {
      helpers.generateStreamThumbnail(session.publishStreamPath)
    }, {
      scheduled: false
    });
    // Save tasks in the session so we can stop it later
    session.task = task;
    // Start the tasks
    task.start();
  }catch(e){
  }

});

nms.on('donePublish', (id, StreamPath, args) => {
  let session = nms.getSession(id)

  // Stop thumbnail generation cron
  if(session.task) session.task.stop();
  // Remove thumbnail
  try{
    helpers.removeStreamThumbnail(StreamPath);
  }catch(e){
  }
  axios.post(
      `${config.guaclive.api_endpoint}/live/on_publish_done`,
      `name=${args.token}&tcUrl=${StreamPath}`, {
        maxRedirects: 0,
        validateStatus: function (status) {
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