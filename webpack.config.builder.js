"use strict";

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const AsyncModulePlugin = require('async-module-loader/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const postcssImport = require('postcss-import');
const postcssMixins = require('postcss-mixins');
const postcssSimpleVars = require('postcss-simple-vars');
const autoprefixer = require('autoprefixer');

module.exports = function(args) {
  const env = args.env;
  const isProd = args.production;
  const buildConfigs = env.buildConfigs;

  const constants = {};
  const srcRoot = path.join(__dirname, 'src');

  const MAIN_ENTRY = 'main';
  const entry = {};
  if (isProd) {
    constants['process.env.NODE_ENV'] = "'production'";
  }
  //SAFARI BUG FIX - no object.assign, need to use babels
  //entry[MAIN_ENTRY] = 'main.js';
  entry[MAIN_ENTRY] = ['babel-polyfill', 'main.js'];
  const plugins = [
    new AsyncModulePlugin(),
    // new webpack.optimize.CommonsChunkPlugin(entryName, null, false),
    new webpack.DefinePlugin(constants),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      inject: false,
      minify: false,
      hash: true
    }),
    new CopyWebpackPlugin([
      { from: 'src/icons', to: 'icons' },
      { from: 'src/assets', to: 'assets' },
      { from: 'src/googleapi', to: 'googleapi' },
      { from: 'src/icons/favicon.ico', to: 'favicon.ico' },
      { from: 'src/icons/apple-touch-icon.png', to: 'apple-touch-icon.png' },
      { from: 'src/excel-templates', to: 'excel-templates' },
    ])
  ];

  if (isProd) {
    plugins.push(new webpack.optimize.UglifyJsPlugin());
  }

  const postcssLoader = '!postcss-loader?parser=postcss-safe-parser';
  let cssLoader = 'css?modules&camelCase&importLoaders=1&-autoprefixer&localIdentName=[folder]-[name]__[local]';
  // cssLoader += (env.optimize.css ? '&minimize' : '');
  cssLoader += postcssLoader;

  return {
    entry: entry,
    devtool: isProd ? null : 'eval-source-map',
    output: {
      path: path.join(__dirname, env.folder),
      filename: '[name].js',
      pathinfo: !isProd,
      sourcePrefix: '',
      chunkFilename: '[name].js',
      // publicPath: ''
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: 'style/useable!' + cssLoader,
          exclude: /(node_modules|bower_components|global)/
        },
        {
          test: /([\s\S]*?)node_modules([\s\S]+?)\.css$/,
          loader: 'style/useable!css'
        },
        {
          test: /([\s\S]*?)global([\s\S]+?)\.css$/,
          loader: 'style/useable!css' + postcssLoader
        },
        // { test: /\.u.css$/, loader: 'style/useable!' + cssLoader },
        // { test: /\.css$/, loader: "style?-singleton!raw" },

        { test: /\.(jpg|jpeg|gif|png|svg|ttf)$/, loader: 'file?name=[path][name].[ext]&context=' + srcRoot },

        { test: /\.tpl$/, loader: 'raw' },
				{ test: /\.json$/, loader: 'json' },
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel',
          query: {
            cacheDirectory: true,
            presets: ['es2015', 'stage-2', 'react'],
            plugins: ['transform-class-properties']
          }
        },
        {
          test: /\.html$/,
          loader: 'tpl',
          include: [ path.resolve(__dirname, 'src/html') ]
        }
      ]
    },
    resolve: {
      root: srcRoot,
      extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.ts', '.tsx']
    },
    plugins: plugins,
    postcss: function() {
      return [
        postcssImport({
          addDependencyTo: webpack
          // from: 'src/styles'
        }),
        postcssMixins(),
        postcssSimpleVars(),
        autoprefixer({ browsers: ['> 1%', 'IE 9'] })
      ];
    }
  };
}