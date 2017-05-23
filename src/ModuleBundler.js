import Promise from 'bluebird';
import path from 'path';
import Yazl from 'yazl';
import resolvePackage from 'resolve-pkg';
import { getWalker, handleFile } from './utils';

/**
 * Handles the inclusion of node_modules.
 */
export default class ModuleBundler {
  /**
   * Create a new instance of ModuleBundler.
   *
   * @param {Object} config   configuration object
   * @param {Object} artifact the artifact instance
   */
  constructor(config, artifact) {
    if (typeof config === 'undefined') {
      throw new Error('Missing config in ModuleBundler');
    }

    this.rootDir = config.rootDir;
    this.zip = config.zip || '';
    this.logger = config.logger || { log: (() => { }) };

    if (typeof artifact === 'undefined') {
      throw new Error('Missing artifact in ModuleBundler');
    }

    if (!(artifact instanceof Yazl.ZipFile)) {
      throw new Error('Artifact must be of type `Yazl.ZipFile`');
    }

    this.artifact = artifact;
  }

  /**
   * Determines module locations then adds them into ./node_modules
   * inside the artifact.
   *
   * @param {Object}   config             configuration object
   * @param {String[]} config.include     list of includes
   * @param {String[]} config.exclude     list of excludes
   * @param {String[]} config.deepExclude list of deep excludes
   *
   * @returns {ModuleBundler} this instance
   */
  async bundle({ include = [], exclude = [], deepExclude = [] }) {
    this.modules = await this._resolveDependencies(
      this.rootDir,
      { include, exclude, deepExclude },
    );

    await Promise.map(this.modules, async ({ packagePath, relativePath }) => {
      const onFile = async (basePath, stats, next) => {
        const relPath = path.join(
          relativePath, basePath.split(relativePath)[1], stats.name
        ).replace(/^\/|\/$/g, '');

        const filePath = path.join(basePath, stats.name);

        await handleFile({
          filePath,
          relPath,
          transforms: [],
          transformExtensions: ['js', 'jsx'],
          useSourceMaps: false,
          artifact: this.artifact,
          zipConfig: this.zip,
        });

        next();
      };

      await getWalker(packagePath)
        .on('file', onFile)
        .end();
    });

    return this;
  }

  /**
   * Resolves a package's dependencies to an array of paths.
   *
   * @param {String} initialPackageDir initial package path
   * @param {Object} config            configuration object
   *
   * @returns {Array}
   *      [ { name, packagePath, packagePath } ]
   *
   * @private
   */
  async _resolveDependencies(
    initialPackageDir,
    { include = [], exclude = [], deepExclude = [] } = {}
  ) {
    const resolvedDeps = [];
    const cache = {};
    const seperator = `${path.sep}node_modules${path.sep}`;

    /**
     * Resolves packages to their package root directory &
     * also resolves dependant packages recursively.
     * - Will also ignore the input package in the results
     *
     * @param {String}   packageDir package directory
     * @param {String[]} _include   list of includes
     * @param {String[]} _exclude   list of excludes
     *
     * @returns {Object[]} list of resolved packages
     */
    const recurse = async (packageDir, _include = [], _exclude = []) => {
      const packageJson = require(path.join(packageDir, './package.json')); // eslint-disable-line

      const { name, dependencies } = packageJson;

      if (typeof dependencies !== 'undefined') {
        /* eslint no-await-in-loop:0 */
        Object.keys(dependencies).forEach(async (packageName) => {
          /**
           *  Skips on exclude matches, if set
           *  Skips on include mis-matches, if set
           */
          if (_exclude.length && _exclude.indexOf(packageName) > -1) return;
          if (_include.length && _include.indexOf(packageName) < 0) return;

          const resolvedDir = resolvePackage(packageName, { cwd: packageDir });

          if (!resolvedDir) return;

          const relativePath = path.join('node_modules', resolvedDir.split(`${seperator}`).slice(1).join(seperator));

          if (relativePath in cache) return;

          cache[relativePath] = true;

          this.logger.log(`[MODULE] ${packageName}`);

          const result = await recurse(resolvedDir, undefined, deepExclude);

          resolvedDeps.push({ ...result, relativePath });
        });
      }

      return {
        name, packagePath: packageDir,
      };
    };

    await recurse(initialPackageDir, include, exclude);

    return resolvedDeps;
  }
}
