const axios = require('axios');
const Logger = require('./node_core_logger');

module.exports = {
  auth: function(data, callback) {
    if (data.config.guaclive.ignore_auth) {
      callback();
      return;
    }

    if (!data || !data.publishStreamPath || data.publishStreamPath.indexOf('/live/') !== 0) {
       data.sendStatusMessage(data.publishStreamId, 'error', 'NetStream.publish.Unauthorized', 'Authorization required.');
       return;
    }

    axios.post(
      `${data.config.guaclive.api_endpoint}/live/publish`,
      `name=${data.publishArgs.token}&tcUrl=${data.publishStreamPath}`, {
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
      callback();
    }).catch(error => {
      Logger.log(`[rtmp publish] Unauthorized. id=${data.id} streamPath=${data.publishStreamPath} streamId=${data.publishStreamId} token=${data.publishArgs.token} `);
      data.sendStatusMessage(data.publishStreamId, 'error', 'NetStream.publish.Unauthorized', 'Authorization required.');
    });
  }
};
