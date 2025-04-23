const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.txt$/,
                type: "asset/source"
            },
            {
                test: /\.mp3$/,
                loader: "arraybuffer-loader"
            }
        ],
    },
    resolve: {
	    extensions: ['.tsx', '.ts', '.js'],
    },
    mode: "development",
    entry: {
        index: "./src/index.ts",
        achievements: "./src/achievements.ts",
        shop: "./src/shop.ts",
    },
    output: {
	    filename: '[name].bundle.js',
	    path: path.resolve(__dirname, 'dist'),
    },
};