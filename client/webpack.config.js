
let { AureliaPlugin } = require('aurelia-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path')
const webpack = require('webpack')

const srcDir = path.resolve(__dirname, 'src');

module.exports = {
  resolve: {
    modules: [srcDir, 'node_modules'],
  },
  entry: {
    app: ['aurelia-bootstrapper'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: {
            loader: 'babel-loader'
        },
      },{
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },{
        test: /\.(jpe?g|gif|png|svg|woff|woff2|ttf|wav|mp3|eot|ttf)$/,
        use: {
            loader: 'url-loader',
        },
      },{
        test: /\.(scss)$/,
        use: [{
            loader: 'style-loader'
          }, {
            loader: 'css-loader'
          }, {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('precss'),
                require('autoprefixer')
              ]
          }
          }, {
            loader: 'sass-loader'
        },]
      },{
        test: /\.html$/,
        use: [{
            loader: 'html-loader',
            options: { minimize: false },
        },],
      },
    ]
  },

  plugins: [
    new AureliaPlugin({
      aureliaApp: undefined,
      includeAll: 'src',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new CopyWebpackPlugin([
      { from: 'src/index.html', to: 'index.html' }
    ])
  ],

  devServer: {
    host: '0.0.0.0',
    port: 3000,
    contentBase: path.join(__dirname, 'dist'),
    publicPath: '/',
    proxy: {
      "/api": {
        target: "http://sawtooth-rest-api:8008",
        pathRewrite: {"^/api" : ""}
      }
    },
  }
}
