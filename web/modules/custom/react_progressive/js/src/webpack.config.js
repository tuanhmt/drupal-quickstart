const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src', 'index.js'),
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'react_app.js'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            components: path.resolve(__dirname, 'src', 'components'),
            environment: path.resolve(__dirname, 'src', 'environment'),
            styles: path.resolve(__dirname, 'src', 'styles'),
        },
    },
    devServer: {
        contentBase: './src',
        publicPath: '/../dist',
    },
    module: {
        rules: [
            {
                test: /\.js$|jsx/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react', '@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader', 'css-loader'
                ]
            }
        ]
    }
}