const fs = require('fs');
const path = require('path');

module.exports = {

    readDir(directoryPath) {
        const files = fs.readdirSync(directoryPath);
        const filesReturn = [];
        files.forEach((file) => {
            filesReturn.push(path.join(directoryPath, file));
        });
        return filesReturn;
    },

    readFile(fileName) {
        return fs.readFileSync(fileName).toString();
    },

    saveFile(fileName, data) {
        fs.writeFile(fileName, JSON.stringify(data, null, 4), () => { });
    }    
}