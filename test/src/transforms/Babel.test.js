import chai, { expect } from 'chai';
import fs from 'fs-extra';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import BabelTrasform from './../../../src/transforms/Babel';

chai.use(dirtyChai);
chai.use(sinonChai);

const logger = console;

const config = fs.readJsonSync('.babelrc');

logger.log(JSON.stringify(config));

describe('BabelTrasform', () => {
  let transform;

  beforeEach(() => {
    transform = new BabelTrasform(config);
  });

  it('is created successfully', () => {
    expect(transform instanceof BabelTrasform);
  });

  it('runs successfully', async () => {
    const result = transform.run({
      code: await fs.readFile(`${__dirname}/../../fixture/utils.js`),
      map: '',
      relPath: './../../fixture/utils.js',
    });

    expect(typeof result.code).to.not.equal('undefined');
    expect(typeof result.map).to.not.equal('undefined');
  });
});
