const path = require('path');

module.exports = {
  mode: 'development', // Use 'production' for production builds
  entry: './renderer/pages/home.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // Injects styles into the DOM
          'css-loader'    // Interprets CSS files
        ],
      },
    ],
  },
  resolve: {
    alias: {
        'wavesurfer.js': path.resolve(__dirname, 'node_modules/wavesurfer.js/dist/wavesurfer.js'),
      },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
