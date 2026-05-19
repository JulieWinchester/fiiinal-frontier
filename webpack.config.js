const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html.ejs',
      filename: 'index.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      template: './public/kobayashi-maru.html.ejs',
      filename: 'kobayashi-maru.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'scenes', to: 'scenes' },
        { from: 'assets', to: 'assets' },
      ],
    }),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'public') },
      { directory: path.join(__dirname, 'scenes'), publicPath: '/scenes' },
      { directory: path.join(__dirname, 'assets'), publicPath: '/assets' },
    ],
    compress: true,
    port: 9000,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};
