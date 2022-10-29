module.exports = {
    data: [],

    getStorage() {
        return this.data;
    },

    setStorage(data) {
        this.data = data;
    },

    addToStorage(item) {
        this.data.push(item);
    }
};