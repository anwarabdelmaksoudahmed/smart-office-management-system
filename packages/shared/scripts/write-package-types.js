const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'dist');

fs.mkdirSync(path.join(root, 'cjs'), { recursive: true });
fs.mkdirSync(path.join(root, 'esm'), { recursive: true });

fs.writeFileSync(
  path.join(root, 'cjs', 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2) + '\n',
);
fs.writeFileSync(
  path.join(root, 'esm', 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2) + '\n',
);
