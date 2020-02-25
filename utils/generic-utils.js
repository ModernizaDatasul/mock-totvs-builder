module.exports = {

    copyArray(list) {
        if (!list) return [];
        return JSON.parse(JSON.stringify(list));
    },

    btoa(str) {
        var buffer;

        if (str instanceof Buffer) {
            buffer = str;
        } else {
            buffer = new Buffer(str.toString(), 'binary');
        }

        return buffer.toString('base64');
    },

    atob(str) {
        return Buffer.from(str, 'base64').toString('binary');
    }
}