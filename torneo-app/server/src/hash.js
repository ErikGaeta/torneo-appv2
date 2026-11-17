// Genera un hash para ADMIN_PASSWORD_HASH:  npm run hash -- "mi contraseña"
import bcrypt from 'bcryptjs';

const pwd = process.argv[2];
if (!pwd) {
  console.error('Uso: npm run hash -- "tu contraseña"');
  process.exit(1);
}
console.log(bcrypt.hashSync(pwd, 10));
