import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';

async function main() {
  const uri = 'mongodb+srv://danhvt504dev_db_user:tu8zPpEiyivRODDt@taskflow-cluster.0grfsch.mongodb.net/ProjectManagementDB?appName=taskflow-cluster';
  await mongoose.connect(uri);

  const targetEmail = 'schema-test-xyz3@example.com';
  
  // Use raw collection or updateOne to ensure direct database write
  const result = await mongoose.connection.collection('users').updateOne(
    { email: targetEmail },
    { $set: { plan: 'FREE', currentPlanExpiresAt: null } }
  );

  console.log('Update result:', result);

  // Fetch back to verify
  const updatedUser = await mongoose.connection.collection('users').findOne({ email: targetEmail });
  console.log('\n--- VERIFICATION FROM MONGO DB ---');
  console.log('ID:', updatedUser._id);
  console.log('Email:', updatedUser.email);
  console.log('Plan:', updatedUser.plan);
  console.log('CurrentPlanExpiresAt:', updatedUser.currentPlanExpiresAt);

  await mongoose.disconnect();
}

main().catch(console.error);
