import * as path from 'path';
import * as os from 'os';

import * as semver from 'semver';

import * as pkg from '../package.json';

export const USER_AGENT = `${pkg.name}/${pkg.version}`;
export const _7ZR_PATH = path.join(__dirname, '..', 'vendor', '7zr.exe');

export function getTempDir() {
  return process.env['RUNNER_TEMP'] || os.tmpdir();
}

import {fetch} from 'undici';


/**
 * Normalizes a version string loosely in the format `X.X.X-abc` (version may
 * not contain all of these parts) to a valid semver version.
 *
 * @param version {string}
 * @param isGitRelease {boolean}
 * @returns {string | null}
 */
export function normalizeVersion(version, isGitRelease) {
  // Git builds have no version because they are not the same branch as releases
  // they mostly use git commits, build dates or numbers instead of a semver
  // version.
  if (isGitRelease) return semver.valid('0.0.0-' + version);
  const valid = semver.valid(version);
  if (valid) return valid;
  // Fix versions like x.y which are not valid with semver.
  const [ver, ...extra] = version.split('-');
  let [major, minor, ...patch] = ver.split('.');
  if (!minor) minor = '0';
  if (patch.length === 0) patch = ['0'];
  const normalized =
    [major, minor, ...patch].join('.') + (extra.length !== 0 ? '-' + extra.join('-') : '');
  return semver.valid(normalized);
}

/**
 * Clean up a version to use to match requested versions on johnvansickle.com and
 * evermeet.cx.
 *
 * @param version {string}
 * @returns {string}
 */
export function cleanVersion(version) {
  const clean = semver.clean(version);
  return (clean && clean.replace(/\.0+$/, '')) || version;
}

export function fetchWithRetry(url, options, retries = 3) {
  return new Promise(async (resolve, reject) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetchWithRetry(url, options);
        if (res.ok) return resolve(res);
        lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
      } catch (error) {
        lastError = error;
      }
    }
    reject(lastError);
  });
}
