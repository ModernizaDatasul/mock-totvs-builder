const fs = require('fs');

module.exports = {

    readDir(directoryPath) {
        const files = fs.readdirSync(directoryPath);
        const filesReturn = [];
        files.forEach((file) => {
            filesReturn.push(directoryPath.concat("\\").concat(file));
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