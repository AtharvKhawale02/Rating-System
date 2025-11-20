const bcrypt = require('bcrypt');
const { User } = require('./src/models');

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await User.create({
      name: 'System Administrator Account',
      email: 'admin@example.com',
      password: hashedPassword,
      address: '123 Admin Street, City, State, Country - 12345',
      role: 'admin'
    });
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
