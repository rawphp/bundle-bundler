import path from 'path';
import fsp from 'fs-promise';
import { typeOf } from 'lutils';
import Yazl from 'yazl';
import glob from 'minimatch';
import { getWalker, handleFile } from './utils';
import BabelTransform from './transforms/Babel';
import UglifyTransform from './transforms/Uglify';

/**
 * Handles the inclusion of source code in the artifact.
 */
export default class SourceBundler {
  /**
   * Create a new instance of SourceBundler.
   *
   * @param {Object} config   configuration object
   * @param {Object} artifact the artifact instance
   */
  constructor(config, artifact) {
    if (typeof config === 'undefined') {
      throw new Error('Missing config in SourceBundler');
    }

    this.rootDir = config.rootDir;
    this.babel = config.babel || false;
    this.uglify = config.uglify || false;
    this.sourceMaps = config.sourceMaps || false;
    this.logger = config.logger || { log: (() => { }) };
    this.zip = config.zip || '';

    if (typeof artifact === 'undefined') {
      throw new Error('Missing artifact in SourceBundler');
    }

    if (!(artifact instanceof Yazl.ZipFile)) {
      throw new Error('Artifact must be of type `Yazl.ZipFile`');
    }


    this.artifact = artifact;
  }

  /**
   * Walks through, transforms, and zips source content which is both
   * `included` and not `excluded` by the regex or glob patterns.
   *
   * @param {Object}   config         configuration object
   * @param {String[]} config.exclude list of excludes
   * @param {String[]} config.include list of includes
   *
   * @returns {Object} the artifact
   */
  async bundle({ exclude = [], include = [] }) {
    const transforms = await this._createTransforms();

    const onFile = async (basePath, stats, next) => {
      /**
       *  A relative path to the servicePath
       *  @example ./functions/test/handler.js
       */
      const relPath = path.join(
        basePath.split(this.rootDir)[1], stats.name,
      ).replace(/^\/|\/$/g, '');

      const filePath = path.join(basePath, stats.name);

      const testPattern = (pattern) => { // eslint-disable-line
        return typeOf.isRegExp(pattern)
          ? pattern.test(relPath)
          : glob(relPath, pattern, { dot: true });
      };

      const included = include.some(testPattern);
      const excluded = exclude.some(testPattern);

      /**
       * When a pattern matches an exclude, it skips
       * When a pattern doesnt match an include, it skips
       */
      if (!included || (excluded && !included)) return next();

      await handleFile({
        filePath,
        relPath,
        transforms,
        transformExtensions: ['js', 'jsx'],
        useSourceMaps: this.sourceMaps,
        artifact: this.artifact,
        zipConfig: this.zip,
      });

      this.logger.log(`[SOURCE] ${relPath}`);

      return next();
    };

    // We never want node_modules here
    await getWalker(this.rootDir, { filters: [/\/node_modules\//i] })
      .on('file', onFile)
      .end();

    return this.artifact;
  }

  /**
   * Create a list of transforms.
   *
   * @returns {Object[]} list of transforms
   *
   * @private
   */
  async _createTransforms() {
    const transforms = [];

    if (this.babel) {
      let babelQuery = this.babel;

      if (!typeOf.isObject(babelQuery)) {
        const babelrcPath = path.join(this.rootDir, '.babelrc');

        babelQuery = fsp.existsSync(babelrcPath)
          ? JSON.parse(await fsp.readFile(babelrcPath))
          : babelQuery;
      }

      transforms.push(new BabelTransform(babelQuery));
    }

    let uglifyConfig = this.uglify;

    if (uglifyConfig) {
      if (!typeOf.isObject(uglifyConfig)) uglifyConfig = null;

      transforms.push(new UglifyTransform(uglifyConfig, { logErrors: true }));
    }

    return transforms;
  }
}
