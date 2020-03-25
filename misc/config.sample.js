/* Check misc/index.js for all available options */
module.exports = {
    /* This is the endpoint where the live/publish POST request will be sent */
    endpoint: 'http://api.example.com',
    api_user: 'nms',
    api_pass: 'nms',
    api_secret: 'nms',
    http_port: 8000,
    /* Whether to enable stream quality options */
    transcode: true,
    /* Whether to archive all streams */
    archive: false,
    /* Whether to generate thumbnails for all streams */
    generateThumbnail: false,
    /*
    https_port: 8443,
    https_cert: '/path/to/cert.pem',
    https_key: '/path/to/key.pem',
    */
   /* For uploading a stream to archives */
    s3: {
        accessKey: '',
        secret: '',
        bucket: '',
        endpoint: '',
        concurrency: 4,
        publishUrl: ''
    },
   ffmpeg_path: '/usr/bin/ffmpeg'
  };
