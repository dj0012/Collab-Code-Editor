const fs = require('fs');

let serverContent = fs.readFileSync('server/index.js', 'utf8');
serverContent = serverContent.replace(
  'const userExists = room.users.some(user => user.socketId === newAdminId);',
  'const userExists = room.users.some(user => user.userId === newAdminId);'
);
fs.writeFileSync('server/index.js', serverContent);

let clientContent = fs.readFileSync('client/src/components/UserList.jsx', 'utf8');
clientContent = clientContent.replace(
  'onClick={() => onAssignAdmin(user.socketId)}',
  'onClick={() => onAssignAdmin(user.userId)}'
);
// Make sure to replace the right one if there are multiple. 
// "Make Admin" button is around line 120.
fs.writeFileSync('client/src/components/UserList.jsx', clientContent);

console.log('Successfully fixed assign_admin logic.');
