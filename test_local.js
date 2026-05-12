import http from 'http';

http.get('http://0.0.0.0:3000/api/admin/groups', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data.substring(0, 500)));
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
