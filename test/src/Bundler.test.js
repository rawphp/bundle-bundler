import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import { ZipFile } from 'yazl';
import fs from 'fs-extra';
import Bundler from './../../src/index';
import SourceBundler from './../../src/SourceBundler';
import ModuleBundler from './../../src/ModuleBundler';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('Bundler', () => {
  let bundler;

  beforeEach(() => {
    bundler = new Bundler({
      rootDir: process.cwd(),
      babel: true,
      sourceMaps: true,
      uglify: true,
      logger: console,
    });
  });

  describe('instance', () => {
    it('is instantiated correctly', () => {
      expect(bundler instanceof Bundler);
      expect(bundler.artifact instanceof ZipFile).to.equal(true);
      expect(bundler.version).to.equal('latest');
      expect(bundler.sourceBundler instanceof SourceBundler).to.equal(true);
      expect(bundler.moduleBundler instanceof ModuleBundler).to.equal(true);
    });
  });

  describe('bundle', () => {
    it('bundles project successfully', async () => {
      const fileName = '/tmp/bundler-bundle.zip';
      await bundler.bundle({
        output: fileName,
        include: ['src/**/*'],
      });

      expect(fs.existsSync(fileName));
    }).timeout(10000);
  });
});
