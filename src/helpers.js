const findTranslation = (word, dictionary) => {
	return word.split('.').reduce((o, i, t, arr)=> {
        if (!o) {
            arr = [];
            return;
        }
        return o[i]
    }, dictionary);
}

module.exports = {
    findTranslation
}