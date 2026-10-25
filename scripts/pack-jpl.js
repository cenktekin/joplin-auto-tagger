#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const tar = require('tar');

(async () => {
  try {
    const root = process.cwd();
    const distDir = path.join(root, 'dist');
    const publishDir = path.join(root, 'publish');
    const manifestPath = path.join(root, 'src', 'manifest.json');

    if (!fs.existsSync(distDir)) throw new Error(`Missing dist directory at ${distDir}. Did you run 'npm run build'?`);
    if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest at ${manifestPath}`);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pluginId = manifest.id;
    const version = manifest.version;
    if (!pluginId) throw new Error('manifest.id is required');

    if (!fs.existsSync(publishDir)) fs.mkdirSync(publishDir);

    const suffix = process.env.JPL_SUFFIX ? `-${process.env.JPL_SUFFIX}` : '';
    const jplName = `${pluginId}${suffix}.jpl`;
    const jplPath = path.join(publishDir, jplName);

    // Create tar of dist contents (no parent dir) as .jpl
    // Ensures POSIX tar without compression as Joplin expects a tar archive
    await tar.c({ cwd: distDir, portable: true, noMtime: true, file: jplPath }, ['.']);

    // Optional: write minimal metadata JSON (not required to import locally, but useful)
    const meta = {
      id: pluginId,
      version,
      name: manifest.name,
      app_min_version: manifest.app_min_version,
      description: manifest.description,
      _generatedAt: new Date().toISOString(),
    };
    const metaPath = path.join(publishDir, `${pluginId}.json`);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    console.log(`Packed ${jplPath}`);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
