import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existing = await User.findOne({ email: 'test@giftsutra.com' });
    if (existing) {
      console.log('Test user already exists!');
      console.log('Email:    test@giftsutra.com');
      console.log('Password: Test@1234');
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@1234', salt);

    const testUser = await User.create({
      name: 'Test User',
      email: 'test@giftsutra.com',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser',
    });

    console.log('✅ Test user created successfully!');
    console.log('----------------------------------');
    console.log('Name:     Test User');
    console.log('Email:    test@giftsutra.com');
    console.log('Password: Test@1234');
    console.log('----------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding test user:', err.message);
    process.exit(1);
  }
};

seedTestUser();
