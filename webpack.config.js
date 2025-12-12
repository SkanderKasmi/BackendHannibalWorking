module.exports = (options, webpack) => {
  return {
    ...options,
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  decorators: true,
                },
                transform: {
                  legacyDecorator: true,
                  decoratorMetadata: true,
                },
                target: 'es2021',
              },
              module: {
                type: 'commonjs',
              },
            },
          },
        },
      ],
    },
    externals: [
      // Exclude optional microservices dependencies
      '@grpc/grpc-js',
      '@grpc/proto-loader',
      'nats',
      'mqtt',
      '@nestjs/platform-socket.io',
      'socket.io',
      // Keep other externals as needed
    ],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/websockets',
            'cache-manager',
            'class-validator',
            'class-transformer',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};

