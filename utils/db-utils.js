module.exports = {

    applyQueryFilter(list, query) {
        let filteredList = list;

        Object.keys(query).forEach((key) => {
            if (key !== 'pageSize' && key !== 'page' && key !== 'fields' && key !== 'order') {
                filteredList = filteredList.filter((item) => {
                    let queryValue = query[key];
                    let itemValue = item[key];

                    if (itemValue === null || itemValue == undefined) { return true; }

                    if (typeof queryValue === 'string') { queryValue = queryValue.toUpperCase(); }
                    if (typeof itemValue === 'string') { itemValue = itemValue.toUpperCase(); }

                    if (queryValue === 'ALL') { return true; }

                    if (typeof queryValue === 'string') {

                        // QueryParam do tipo Range
                        if (queryValue.indexOf(";") !== -1) {
                            let queryValueIni = queryValue.split(";")[0];
                            let queryValueFim = queryValue.split(";")[1];
                            return itemValue >= queryValueIni && itemValue <= queryValueFim;
                        }

                        // QueryParam do tipo List
                        if (queryValue.indexOf(",") !== -1) {
                            let queryValueList = queryValue.split(",");
                            return queryValueList.indexOf(itemValue.toString().toUpperCase()) !== -1;
                        }
                    }

                    if (typeof itemValue === 'string') {
                        return itemValue.includes(queryValue);
                    }

                    if (typeof itemValue === 'boolean') {
                        if (itemValue && queryValue === 'TRUE') { return true; }
                        if (!itemValue && queryValue === 'FALSE') { return true; }
                        if (itemValue && (!queryValue)) { return true; }
                        return false;
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