const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    app: './src/app.jsx'
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: false
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};