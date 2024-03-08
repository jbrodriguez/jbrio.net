import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';

import { SITE_URL } from '~/consts';

const start = +new Date();

const fileContent = readFileSync('./dist/posts/atom.xml/index.html', 'utf8');

let replacedContent = fileContent.replace(/support>/g, 'link>');
replacedContent = replacedContent.replace(/--\[/g, '[');
replacedContent = replacedContent.replace(/\]--/g, ']');
replacedContent = replacedContent.replace(/\/_astro\//g, `${SITE_URL}/_astro/`);
replacedContent = replacedContent.replace(
  /<!DOCTYPE html>/g,
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
);

writeFileSync('./dist/posts/index.xml', replacedContent);

const atomFolderPath = './dist/posts/atom.xml';
if (existsSync(atomFolderPath)) {
  rmSync(atomFolderPath, { recursive: true, force: true });
}

const end = +new Date();
console.log(`\nindex.xml created (+${end - start}ms)\n`);
