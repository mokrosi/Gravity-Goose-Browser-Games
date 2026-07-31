const fs = require('fs');

let content = fs.readFileSync('./assets/map/coordinate.js', 'utf8');

// The file defines `const levelOne = { ... };`
// Let's extract the object string.
let objStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);

let levelOne = eval('(' + objStr + ')');

function duplicateLevel(base, dx) {
    let newLevel = JSON.parse(JSON.stringify(base));
    newLevel.goombas.push([300 + dx*10, 176, 16, 16]);
    newLevel.goombas.push([400 + dx*10, 176, 16, 16]);
    if (dx > 0) {
        newLevel.koopas.push([500 + dx*20, 176, 16, 24]);
    }
    return newLevel;
}

let levels = [];
for(let i=0; i<5; i++) {
    levels.push(duplicateLevel(levelOne, i));
}

let newContent = `const levels = ${JSON.stringify(levels, null, 2)};\n`;
fs.writeFileSync('./assets/map/coordinate.js', newContent);
console.log('Levels generated.');
