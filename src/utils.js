import Promise from 'bluebird';
import walk from 'walk';
import path from 'path';
import fsp from 'fs-promise';
import { typeOf } from 'lutils';

/**
 * Creates a walker.
 *
 * @param {*[]} args list of args
 *
 * @returns {Object} walker instance
 */
export function getWalker(...args) {
  const walker = walk.walk(...args);

  walker.end = () => new Promise((resolve, reject) => {
    walker.on('error', reject);
    walker.on('end', resolve);
  });

  return walker;
}

/**
 * Normalizes transforming and zip allocation for walked files.
 *
 * Used by SourceBundler & ModuleBundler
 *
 * @param {Object}   config                     handler configuration
 * @param {String}   config.filePath            absolute path to the file to handle
 * @param {String}   config.relPath             relative path to the file to handle
 * @param {Object}   config.artifact            the artifact instance
 * @param {String}   config.zipConfig           zip options
 * @param {Boolean}  config.useSourceMaps       use source maps flag
 * @param {String[]} config.transformExtensions list of extensions to transform
 * @param {Object[]} config.transforms          list of transforms configuration
 *
 * @returns {Object} artifact
 */
export async function handleFile({
    filePath, relPath,
  artifact, zipConfig, useSourceMaps,
  transformExtensions, transforms,
}) {
  const extname = path.extname(filePath);
  const isTransformable = transformExtensions.some(ext => `.${ext}` === extname.toLowerCase());

  // TODO: make each transformer check extensions itself, and concat their
  // extension whitelist to check here.
  if (isTransformable) {
    //
    // JAVASCRIPT
    //

    let code = await fsp.readFile(filePath, 'utf8');
    let map = '';

    /**
     *  Runs transforms against the code, mutating the code & map
     *  with each iteration, optionally producing source maps
     */
    if (transforms.length) {
      transforms.forEach((transformer) => {
        const result = transformer.run({ code, map, filePath, relPath });

        if (result.code) {
          code = result.code;
          if (result.map) map = result.map;
        }
      });
    }

    artifact.addBuffer(new Buffer(code), relPath, zipConfig);

    if (useSourceMaps && map) {
      if (typeOf.isObject(map)) map = JSON.stringify(map);

      artifact.addBuffer(new Buffer(map), `${relPath}.map`, zipConfig);
    }
  } else {
    //
    // ARBITRARY FILES
    //

    artifact.addFile(filePath, relPath, zipConfig);
  }

  return artifact;
}
