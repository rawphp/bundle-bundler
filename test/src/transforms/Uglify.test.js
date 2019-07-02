import chai, { expect } from 'chai';
import fs from 'fs-extra';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import UglifyTrasform from './../../../src/transforms/Uglify';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('UglifyTrasform', () => {
  let transform;

  beforeEach(() => {
    transform = new UglifyTrasform(null);
  });

  it('is created successfully', () => {
    expect(transform instanceof UglifyTrasform);
  });

  it('runs successfully', async () => {
    const result = transform.run({
      code: await fs.readFile(`${__dirname}/../../fixture/utils.js`),
      map: '',
      filePath: './../../fixture/utils.js',
    });

    expect(typeof result.code).to.not.equal('undefined');
    expect(typeof result.map).to.not.equal('undefined');
  });
});
