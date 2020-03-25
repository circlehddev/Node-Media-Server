//
//  Created by Mingliang Chen on 18/3/16.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
const Logger = require('./node_core_logger');

const EventEmitter = require('events');
const { spawn } = require('child_process');

const RTSP_TRANSPORT = ['udp', 'tcp', 'udp_multicast', 'http'];

class NodeRelaySession extends EventEmitter {
  constructor(conf) {
    super();
    this.conf = conf;
  }

  run() {
    let format = this.conf.ouPath.startsWith('rtsp://') ? 'rtsp' : 'flv';
    let argv = ['-fflags', 'nobuffer', '-i', this.conf.inPath, '-c', 'copy', '-f', format, this.conf.ouPath,
		'-stimeout', '10000000 ','-reconnect', '1', '-reconnect_at_eof', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '2']
    if (this.conf.inPath[0] === '/' || this.conf.inPath[1] === ':') {
      argv.unshift('-1');
      argv.unshift('-stream_loop');
      argv.unshift('-re');
    }

    if (this.conf.inPath.startsWith('rtsp://') && this.conf.rtsp_transport) {
      if (RTSP_TRANSPORT.indexOf(this.conf.rtsp_transport) > -1) {
        argv.unshift(this.conf.rtsp_transport);
        argv.unshift('-rtsp_transport');
      }
    }

    Logger.ffdebug(argv.toString());
    this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
    this.ffmpeg_exec.on('error', (e) => {
      Logger.ffdebug(e);
    });

    this.ffmpeg_exec.stdout.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.stderr.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.on('close', (code) => {
      Logger.log('[Relay end] id=', this.id);
      this.ffmpeg_exec = null;
      if (!this._ended) {
        this._runtimeout = setTimeout(() => {
          this._runtimeout = null;
          this.run();
        }, 1000);
      } else {
        this.emit('end', this.id);
      }
    });
  }

  end() {
    this._ended = true;
    if (this._runtimeout != null) {
      clearTimeout(this._runtimeout);
      this._runtimeout = null;
    }
    if (this.ffmpeg_exec) {
      this.ffmpeg_exec.kill();
    } else {
      this.emit('end', this.id);
    }
  }
}

module.exports = NodeRelaySession;
