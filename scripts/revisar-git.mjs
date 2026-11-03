// Revisa git antes de publicar (npm run deploy): lo que se publica tiene que estar subido a
// github.com/JhamG9/CarNotice, para que el repositorio y el sitio publicado coincidan.

import { execSync } from 'node:child_process';

const REPO = 'github.com/JhamG9/CarNotice';
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
const fallar = (mensaje) => {
  console.error(mensaje);
  process.exit(1);
};

const origen = git('remote get-url origin');
if (!origen.replace(/\.git$/, '').endsWith(REPO)) {
  fallar(`El remoto origin es ${origen}, no ${REPO}. Se publica solo desde ese repositorio.`);
}

if (git('status --porcelain')) {
  fallar('Hay cambios sin commit. Haz commit y git push a CarNotice antes de publicar.');
}

const rama = git('rev-parse --abbrev-ref HEAD');
git(`fetch origin ${rama} --quiet`);
let remota;
try {
  remota = git(`rev-parse origin/${rama}`);
} catch {
  fallar(`La rama ${rama} no existe en CarNotice. Súbela con git push -u origin ${rama}.`);
}
if (git('rev-parse HEAD') !== remota) {
  fallar(`La rama ${rama} no coincide con origin/${rama}. Haz git push (o git pull) antes de publicar.`);
}
