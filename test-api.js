const testSignup = async () => {
  try {
    const res = await fetch('https://roxiler-3m7g.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://roxiler-ui.onrender.com'
      },
      body: JSON.stringify({
        name: 'Test Account For Render',
        email: 'testrender1@example.com',
        address: 'Test Address 123',
        password: 'TestPassword1!'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
};
testSignup();
