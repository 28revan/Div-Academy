import http from 'http';

const data = JSON.stringify({
  email: 'revaneliyev133@gmail.com',
  password: 'revan28@!'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let outUrl = '';
  res.on('data', d => {
    outUrl += d;
  });
  res.on('end', () => console.log(outUrl));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
