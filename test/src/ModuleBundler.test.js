import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import Yazl from 'yazl';
import ModuleBundler from './../../src/ModuleBundler';

chai.use(dirtyChai);
chai.use(sinonChai);

let artifact;

describe('ModuleBundler', () => {
  beforeEach(() => {
    artifact = new Yazl.ZipFile();
  });

  describe('instance', () => {
    it('throws error if config is not provided', () => {
      let result;

      try {
        result = new ModuleBundler();
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Missing config in ModuleBundler');
    });

    it('throws error if artifact is not provided', () => {
      let result;

      try {
        result = new ModuleBundler({
          rootDir: process.cwd(),
        });
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Missing artifact in ModuleBundler');
    });

    it('throws error if artifact is of the wrong type', () => {
      let result;

      try {
        result = new ModuleBundler({
          rootDir: process.cwd(),
        }, {});
      } catch (error) {
        result = error;
      }

      expect(typeof result).to.equal('object');
      expect(result.message).to.equal('Artifact must be of type `Yazl.ZipFile`');
    });

    it('is instantiated correctly', () => {
      const bundler = new ModuleBundler({
        rootDir: process.cwd(),
      }, artifact);

      expect(bundler instanceof ModuleBundler);
    });
  });

  describe('bundle', () => {
    let bundler;

    beforeEach(() => {
      bundler = new ModuleBundler({
        rootDir: process.cwd(),
      }, artifact);
    });

    it('has functions', () => {
      expect(typeof bundler.bundle).be.equal('function');
    });

    it('bundles project modules', async () => {
      expect(artifact.entries.length).to.equal(0);

      await bundler.bundle({});

      expect(artifact.entries.length).to.be.greaterThan(0);
      expect(artifact.ended).to.equal(false);
      expect(artifact.allDone).to.equal(false);
    });
  });
});
