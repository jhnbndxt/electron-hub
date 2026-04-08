import bcrypt from 'bcryptjs';

async function generateHashes() {
  const passwords = [
    { email: 'electroncashier123@gmail.com', password: 'cashier123' },
    { email: 'electronregistrar@gmail.com', password: 'registrar123' },
    { email: 'electronbranchcoor@gmail.com', password: 'branchcoor123' },
    { email: 'joshua@gmail.com', password: 'root' }
  ];

  console.log('Generated bcrypt hashes:');
  console.log('========================\n');

  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log('---');
  }
}

generateHashes();
