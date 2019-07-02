import Promise from 'bluebird';
import path from 'path';
import { ZipFile } from 'yazl';
import fs from 'fs-extra';
import ModuleBundler from './ModuleBundler';
import SourceBundler from './SourceBundler';

export default class Bundler {
  /**
   * Create a new instance of Bundler.
   *
   * @param {Object} config         configuration object
   * @param {String} config.rootDir root service directory path
   * @param {Object} config.logger  logger instance with .log method
   */
  constructor(config) {
    this.rootDir = config.rootDir;
    this.logger = config.logger;
    this.babel = config.babel || false;
    this.uglify = config.uglify || false;
    this.sourceMaps = config.sourceMaps;

    this.artifact = new ZipFile();
    this.version = 'latest';

    this.sourceBundler = new SourceBundler({
      rootDir: this.rootDir,
      logger: this.logger,
      babel: this.babel,
      uglify: this.uglify,
      sourceMaps: this.sourceMaps,
    }, this.artifact);
    this.moduleBundler = new ModuleBundler({
      rootDir: this.rootDir,
      logger: this.logger,
    }, this.artifact);
  }

  /**
   * Bundle the project.
   *
   * @param {Object}   config         configuration object
   * @param {String}   config.output  the file name
   * @param {String[]} include        list of source includes
   * @param {String[]} exclude        list of source excludes
   * @param {String[]} moduleIncludes list of module includes
   * @param {String[]} moduleExcludes list of module excludes
   *
   * @returns {undefined}
   */
  async bundle({
    output,
    include = [],
    exclude = [],
    moduleIncludes = [],
    moduleExcludes = [],
  }) {
    // make sure root directory exists
    await fs.ensureDir(this.rootDir);

    // bundle sources
    await this.sourceBundler.bundle({
      include,
      exclude,
    });

    // bundle modules
    await this.moduleBundler.bundle({
      include: moduleIncludes,
      exclude: moduleExcludes,
      ...this.modules,
    });

    const zipPath = path.resolve(output);

    await new Promise((resolve, reject) => {
      this.artifact.outputStream.pipe(fs.createWriteStream(zipPath))
        .on('error', reject)
        .on('close', resolve);

      this.artifact.end();
    });

    this.logger.log('Application Bundle Built Successfully');
  }
}
