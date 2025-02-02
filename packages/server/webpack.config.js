const path = require('path');
const packageRoot = require('app-root-path').path;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');

const root = [path.resolve(__dirname)];
const plugins = [new ForkTsCheckerWebpackPlugin({
    typescript: {
        diagnosticOptions: {
            semantic: true,
            syntactic: true
        }
    }
})];

if (process.env.NODE_ENV !== 'production') {
    plugins.push(new NodemonPlugin({
        // What to watch.
        watch: `${root}/dist`,

        // Arguments to pass to the script being watched.
        args: [],

        // Node arguments.
        nodeArgs: ['--inspect'],

        // Files to ignore.
        ignore: ['*.js.map'],

        // Extensions to watch.
        ext: 'js',

        // Detailed log.
        verbose: true,
    }));
}

module.exports = {
    entry: `${root}/src/index.ts`,
    target: 'node',
    node: {
        __dirname: true
    },
    experiments: {
        syncWebAssembly: true,
        // asyncWebAssembly: true
    },
    externals: [
        /^[a-z\-0-9]+$/ // Ignore node_modules folder
    ],
    output: {
        filename: 'server.js', // output file
        path: `${root}/dist`,
        libraryTarget: "commonjs"
    },
    resolve: {
        // Add in `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json'],
        modules: [
            `${root}/node_modules`,
            'node_modules',
            `${packageRoot}/node_modules`
        ]
    },
    module: {
        rules: [
            {
                // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
                test: /\.tsx?$/,
                // Cache loader references cached files before trying to rebuild them
                use: [
                    {
                        // Process typescript only after caching and threading have been initializeds
                        loader: 'ts-loader',
                        options: {
                            happyPackMode: true // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
                        }
                    }]
            }]
    },
    plugins
};
