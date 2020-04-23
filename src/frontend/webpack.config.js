let path = require('path');

module.exports = {
  // Disable production-specific optimizations by default
  // They can be re-enabled by running the cli with `--mode=production` or making a separate
  // webpack config for production.
  mode: 'development',

  entry: [
    path.resolve(__dirname, 'public-path.js'),
    path.resolve(__dirname, 'js', 'index.tsx'),
  ],

  output: {
    filename: 'index.js',
    path: __dirname + '/../backend/partaj/static/js',
    // `chunkFilename` must have a unique and different name on each build. This will prevent overwriting
    // of existing chunks if backend static storage is on eg. AWS.
    chunkFilename: '[id].[hash].index.js',
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [path.resolve(__dirname, 'js'), __dirname, 'node_modules'],
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: new RegExp(`\.(tsx?|jsx?)$`),
        use: [
          {
            loader: 'babel-loader',
            options: require('./babel.config'),
          },
        ],
      },
    ],
  },
};
