var webpackSharedConfig = require("./webpack.config");

webpackSharedConfig.externals = [];

module.exports = function (config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      'test/shim/server-side-global-vars.js',
      'test/src/*.js',
      'test/src/**/*.js',
    ],

    preprocessors: {
      'test/src/*.js': ['webpack'],
      'test/src/**/*.js': ['webpack'],
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    captureTimeout: 60000,

    singleRun: false,

    webpack: webpackSharedConfig
  });
};
