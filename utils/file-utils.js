const fs = require('fs');
const path = require('path');

module.exports = {

    readDir(directoryPath, filter = null) {
        const files = fs.readdirSync(directoryPath);
        const filesReturn = [];
        files.forEach((file) => {
            if (!filter || file.indexOf(filter) >= 0) {
                filesReturn.push(this.pathJoin(directoryPath, file));
            }
        });
        return filesReturn;
    },

    readFileString(fileName, diretory = null) {
        if (diretory) { fileName = this.pathJoin(diretory, fileName); }

        if (!this.pathExist(fileName)) { return null; }

        return fs.readFileSync(fileName).toString();
    },

    readFile(fileName, diretory = null) {
        if (diretory) { fileName = this.pathJoin(diretory, fileName); }

        if (!this.pathExist(fileName)) { return null; }

        return fs.readFileSync(fileName);
    },

    saveFile(fileName, data) {
        fs.writeFile(fileName, JSON.stringify(data, null, 4), () => { });
    },

    pathJoin(path1, path2) {
        return path.join(path1, path2);
    },

    pathExist(pathFile) {
        if (fs.existsSync(pathFile)) {
            return true;
        }
        return false;
    },

    pathFull(fileName, diretory = null) {
        if (diretory) { fileName = this.pathJoin(diretory, fileName); }

        return path.resolve(fileName);
    }
}