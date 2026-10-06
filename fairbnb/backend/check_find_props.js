const fs = require('fs');
const content = fs.readFileSync('/Users/ideaind/Desktop/tech/fairbnb/backend/src/properties/properties.service.ts', 'utf8');
const match = content.match(/async findMyProperties[\s\S]*?\n  \}/);
if (match) console.log(match[0]);
else console.log('Not found');
