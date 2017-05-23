# Bundle Bundler

The library builds Nodejs applications and creates a zip bundle.

This will bundle the application for production use like `npm install --production` would.

## Usage

```js
import Bundler from 'bundle-bundler';

const bundler = new Bundler({
  rootDir: process.cwd(),
  babel: true,
  sourceMaps: true,
  uglify: false, // not currently working as expected
  logger: console,
});

const config = {
  output: 'application-bundle.zip',
  include: [ 'src/**/*' ],
  exclude: [],
};

await bundler.bundle(config);
```

## License

MIT

## Contributions

This work is based on [Serverless Build Plugin](https://github.com/nfour/serverless-build-plugin) by nfour.
