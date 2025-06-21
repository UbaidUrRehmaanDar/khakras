// Quick token injection script
// Run this in browser console to set the auth token

const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2NzkyYmUzODhjNzk1YmI0YjNmYTciLCJpYXQiOjE3NTA0OTc1ODAsImV4cCI6MTc1MTEwMjM4MH0.vrIU8mrnPGOR3UMAaQIVgn3pXva0uC0sE7HeyfljHxc';

console.log('🔑 Setting test token...');
localStorage.setItem('chakras_token', testToken);
console.log('✅ Token set! Reload the page to authenticate.');

// Also try to trigger auth service reinitialization if it exists
if (window.authService) {
    console.log('🔄 Reinitializing auth service...');
    window.authService.token = testToken;
    window.authService.init();
}

console.log('🧪 You can now test the likes functionality!');
