module.exports = {

    copyArray(list) {
        if (!list) return [];
        return JSON.parse(JSON.stringify(list));
    },

    applyQueryFilter(list, query) {
        let filteredList = list;

        Object.keys(query).forEach((key) => {
            if (key !== 'pageSize' && key !== 'page' && key !== 'fields' && key !== 'order') {
                filteredList = filteredList.filter((item) => {
                    let queryValue = query[key];
                    let itemValue = item[key];

                    if (!itemValue) { return true; }

                    if (typeof queryValue === 'string') { queryValue = queryValue.toUpperCase(); }
                    if (typeof itemValue === 'string') { itemValue = itemValue.toUpperCase(); }

                    if (typeof queryValue === 'string') {

                        // QueryParam do tipo Range
                        if (queryValue.indexOf(";") !== -1) {
                            let queryValueIni = queryValue.split(";")[0];
                            let queryValueFim = queryValue.split(";")[1];
                            return itemValue >= queryValueIni && itemValue <= queryValueFim;
                        }

                        // QueryParam do tipo List
                        if (queryValue.indexOf(",") !== -1) {
                            let queValueList = queryValue.split(",");
                            return queValueList.indexOf(itemValue) !== -1;
                        }
                    }

                    if (typeof itemValue === 'string') {
                        if (queryValue === 'ALL') { return true; }
                        return itemValue.includes(queryValue);
                    }

                    return itemValue == queryValue; // O tipo pode ser diferente então usa ==
                });
            }
        });

        return filteredList;
    },

    applyFields(list, fields) {
        const listOfFields = fields.split(',');

        list.forEach((value) => {
            Object.keys(value).forEach((key) => {
                if (!listOfFields.includes(key)) {
                    delete value[key];
                }
            });
        });
    },

    applyOrder(list, field) {
        const isDesc = field.startsWith('-');

        field = field.replace('-', '');

        list.sort((a, b) => {
            if (a[field] > b[field]) {
                return isDesc ? -1 : 1;
            }
            if (a[field] < b[field]) {
                return isDesc ? 1 : -1;
            }

            return 0;
        });
    }
}