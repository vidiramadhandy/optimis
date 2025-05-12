const logout = async () => {
  const response = await fetch('http://localhost:8000/api/logout', {
    method: 'DELETE',
    credentials: 'include',  // Kirimkan cookies (session_id)
  });

  const data = await response.json();

  if (response.ok) {
    alert('Logged out successfully');
    router.push('/login');  // Redirect ke halaman login setelah logout
  } else {
    alert('Logout failed');
  }
};
