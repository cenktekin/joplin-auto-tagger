const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const distDir = path.resolve(__dirname, 'dist');

// Base configuration for both main plugin and webview
const baseConfig = {
  mode: 'production',
  // Note: target is set per-config below (node for plugin, web for webview)
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      api: path.resolve(__dirname, 'api'),
    },
  },
  output: {
    path: distDir,
    filename: '[name].js',
  },
};

// Configuration for the main plugin (index.ts)
const pluginConfig = {
  ...baseConfig,
  target: 'node',
  entry: {
    index: './src/index.ts',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'plugin.config.json', to: 'plugin.config.json' },
        { from: 'README.md', to: 'README.md' },
        { from: 'logo.png', to: 'logo.png' },
        { from: 'src/manifest.json', to: 'manifest.json' },
      ],
    }),
  ],
};

// Configuration for the webview (React app)
const webviewConfig = {
  ...baseConfig,
  target: 'web',
  entry: {
    webview: './src/webview/index.tsx',
  },
  resolve: {
    ...baseConfig.resolve,
    // Prevent webpack from trying to polyfill Node built-ins for the browser bundle
    fallback: {
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/webview/index.html',
      filename: 'webview.html',
      chunks: ['webview'],
      inject: 'body',
    }),
  ],
};

module.exports = (env, argv) => {
  // Joplin standard build configurations
  if (argv.joplinPluginConfig === 'buildMain') {
    return pluginConfig;
  }

  if (argv.joplinPluginConfig === 'buildExtra') {
    return webviewConfig;
  }

  // Default: build both
  return [pluginConfig, webviewConfig];
};
