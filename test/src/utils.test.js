import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import Yazl, { ZipFile } from 'yazl';
import fs from 'fs-extra';
import { getWalker, handleFile } from './../../src/utils';
import BabelTrasform from './../../src/transforms/Babel';
import UglifyTrasform from './../../src/transforms/Uglify';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('utils', () => {
  const babelrc = fs.readJsonSync('.babelrc');
  const transforms = [
    new BabelTrasform(babelrc),
    new UglifyTrasform(null),
  ];

  describe('getWalker', () => {
    it('returns a walker', () => {
      const walker = getWalker(`${process.cwd()}/src`);

      expect(typeof walker).to.equal('object');
      expect(typeof walker.end).to.equal('function');
    });
  });

  describe('handleFile', () => {
    let artifact;

    beforeEach(() => {
      artifact = new Yazl.ZipFile();
    });

    it('handles a file', async () => {
      const result = await handleFile({
        filePath: `${__dirname}/../fixture/utils.js`,
        relPath: './test/fixture/utils.js',
        artifact,
        zipConfig: '',
        transformExtensions: ['js', 'jsx'],
        transforms,
      });

      expect(result instanceof ZipFile);
      expect(typeof result.outputStream).to.not.equal('undefined');
      expect(typeof result.entries).to.not.equal('undefined');
      expect(result.entries.length).to.equal(1);
      expect(result.ended).to.equal(false);
      expect(result.ended).to.equal(false);
    }).timeout(10000);
  });
});
