const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const web = path.resolve(process.argv[2] || path.join(__dirname, '../../../gira-y-adivina-web'));
const resources = path.resolve(__dirname, '../Resources');
fs.mkdirSync(resources, {recursive:true});
for (const [source, names, output] of [
  ['cien-rioplatenses-datos.js', ['CIEN_CATEGORIAS','CIEN_PREGUNTAS'], 'cien.json'],
  ['ahorcado-rioplatense-datos.js', ['AHORCADO_CATEGORIAS','AHORCADO_DATOS'], 'ahorcado.json'],
  ['rosco-rioplatense-datos.js', ['ROSCO_DATOS'], 'rosco.json']
]) {
  const code = fs.readFileSync(path.join(web, source), 'utf8');
  const value = vm.runInNewContext(code + `\nJSON.stringify({${names.join(',')}})`);
  fs.writeFileSync(path.join(resources, output), JSON.stringify(JSON.parse(value), null, 2) + '\n');
  console.log(output);
}
