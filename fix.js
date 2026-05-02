const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');

content = content.replace(
  'adminId: socket.id,\r\n          users: [],\r\n          files: [],',
  'adminId: userId,\r\n          users: [],\r\n          files: [],'
);
content = content.replace(
  'adminId: socket.id,\n          users: [],\n          files: [],',
  'adminId: userId,\n          users: [],\n          files: [],'
);

fs.writeFileSync('server/index.js', content);
console.log('Successfully updated server/index.js');
