import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const folderName = process.argv[2];
const today = new Date();
const title = folderName;
const cover = `${folderName}-feature.jpg`;
const caption = ' © Juan B. Rodriguez';
const status = 'draft';

const folderPath = join('./src/data/posts', folderName);

// Create the folder if it doesn't exist
if (!existsSync(folderPath)) {
  mkdirSync(folderPath);
}

// Write the markdown file
writeFileSync(
  `${folderPath}/index.md`,
  `---\ntitle: "Notes ${title}"\ndate: ${today.toISOString()}\ncover: ./${cover}\ncaption: "${caption}"\nstatus: ${status}\ndescription: ""\npixelfed: ''\n---`
);
