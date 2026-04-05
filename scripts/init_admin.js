import { db, doc, setDoc } from '../src/utils/firebase.js';

async function initAdmin() {
  const adminId = 'product';
  const invitationKey = 'ADMIN-START-2026';

  try {
    await setDoc(doc(db, "admin_registrations", adminId), {
      invitationKey: invitationKey,
      registered: false,
      name: "メイン管理者"
    });
    console.log(`Successfully initialized admin registration for ID: ${adminId}`);
    console.log(`Use invitation key: ${invitationKey} at /setup page.`);
    process.exit(0);
  } catch (error) {
    console.error("Error initializing admin:", error);
    process.exit(1);
  }
}

initAdmin();
