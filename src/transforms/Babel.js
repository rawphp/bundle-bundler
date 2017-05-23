
const logger = console;

export default class BabelTransform {
  constructor(config = {}, options = {}) {
    this.config = {
      sourceMaps: 'both',
      ...config,
    };

    this.options = {
      skipOnError: false, // When false, errors will halt execution
      logErrors: true,
      ...options,
    };

    this.babel = require('babel-core'); // eslint-disable-line
  }

  /**
   * Run transformer.
   *
   * @param {Object} config transform configuration
   *
   * @return {Object} transformation result
   */
  run({ code, map, relPath }) {
    let result = { code, map };

    try {
      result = this.babel.transform(code, {
        ...this.config,
        sourceFileName: relPath,
        sourceMapTarget: relPath,
      });
    } catch (err) {
      if (this.options.logErrors) logger.error(err);
      if (!this.options.skipOnError) throw err;
    }

    return result;
  }
}
