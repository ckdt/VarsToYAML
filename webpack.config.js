const path = require('path');

module.exports = {
  entry: './src/code.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'code.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
