const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'dist');
fs.mkdirSync(output,{recursive:true});
for (const name of ['index.html','style.css','data.js','app.js','assets']) {
  fs.cpSync(path.join(root,name),path.join(output,name),{recursive:true});
}
console.log('Built static site in dist/');