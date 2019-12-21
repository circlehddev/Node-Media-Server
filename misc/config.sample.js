module.exports = {
    endpoint: 'http://api.example.com',
    api_user: 'nms',
    api_pass: 'nms',
    http_port: 8000,
    transcode: true,
    /*
    https_port: 8443,
    https_cert: '/path/to/cert.pem',
    https_key: '/path/to/key.pem',
    */
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
