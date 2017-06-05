import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import Yazl from 'yazl';
import SourceBundler from './../../src/SourceBundler';

chai.use(dirtyChai);
chai.use(sinonChai);

let artifact;

describe('SourceBundler', () => {
  beforeEach(() => {
    artifact = new Yazl.ZipFile();
  });

  describe('instance', () => {
    it('throws error if config is not provided', () => {
      let result;

      try {
        result = new SourceBundler();
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Missing config in SourceBundler');
    });

    it('throws error if artifact is not provided', () => {
      let result;

      try {
        result = new SourceBundler({
          rootDir: process.cwd(),
        });
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Missing artifact in SourceBundler');
    });

    it('throws error if artifact is of the wrong type', () => {
      let result;

      try {
        result = new SourceBundler({
          rootDir: process.cwd(),
        }, {});
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Artifact must be of type `Yazl.ZipFile`');
    });

    it('is instantiated correctly', () => {
      const bundler = new SourceBundler({
        rootDir: process.cwd(),
      }, artifact);

      expect(bundler instanceof SourceBundler);
    });
  });

  describe('bundle', () => {
    let bundler;

    beforeEach(() => {
      bundler = new SourceBundler({
        rootDir: process.cwd(),
        babel: true,
        uglify: true,
      }, artifact);
    });

    it('has functions', () => {
      expect(typeof bundler.bundle).be.equal('function');
    });

    it('bundles project modules', async () => {
      expect(artifact.entries.length).to.equal(0);

      await bundler.bundle({ include: ['src/**/*'] });

      expect(artifact.entries.length).to.be.greaterThan(0);
      expect(artifact.ended).to.equal(false);
      expect(artifact.allDone).to.equal(false);
    }).timeout(10000);
  });
});
