async function testApi() {
  try {
    const loginRes = await fetch('https://megakem-loyalty-app.onrender.com/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@megakem.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('Login successful');

    const membersRes = await fetch('https://megakem-loyalty-app.onrender.com/api/members?role=applicator', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const membersData = await membersRes.json();
    console.log(JSON.stringify(membersData).substring(0, 500));

    if (membersData && membersData.data) {
      const members = membersData.data.slice(0, 5);
      members.forEach(m => {
        console.log(`Name: ${m.memberName}, WhatsApp: ${m.whatsappNumber}, NIC: ${m.nic}, City: ${m.location}`);
      });
    } else {
      console.log('No members array found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testApi();
