const genUts = require('../utils/generic-utils.js');
const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    query(req, res, entityCfg) {
        this.logRequest('GET (query)', req);

        let customVld = this.customValidationParams('GET', req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = this.applyAllQueryFilters(entityCfg.database, req);

        return res.json(response);
    },

    get(req, res, entityCfg) {
        this.logRequest('GET', req);

        if (entityCfg.base64Key) { req.params.id = genUts.atob(req.params.id); }
        let entityId = req.params.id;

        let customVld = this.customValidationParams('GET', req, res, entityCfg);
        if (customVld) { return customVld; };

        const entityResponse = entityCfg.database.find((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityId);
        });

        if (!entityResponse) {
            return res.status(400).json(
                { error: `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.` }
            );
        }

        customVld = this.customValidationDatabase('GET', entityResponse, res, entityCfg);
        if (customVld) { return customVld; };

        return res.json(entityResponse);
    },

    create(req, res, entityCfg, fileName) {
        this.logRequest('POST (create)', req);

        const entityDB = entityCfg.database;
        const newEntity = req.body;

        const entityId = this.getEntityKeyValue(newEntity, entityCfg.keys);
        if (!req.params) req["params"] = {};
        req.params["id"] = entityId;

        let customVld = this.customValidationParams('POST', req, res, entityCfg);
        if (customVld) { return customVld; };

        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityId);
        });

        if (index !== -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `Já existe ${entityCfg.entityLabel || entityCfg.entityName} com o código ${entityId}.`)])
            );
        }

        entityDB.push(newEntity);

        fileUts.saveFile(fileName, entityCfg);

        return res.json(newEntity);
    },

    update(req, res, entityCfg, fileName) {
        this.logRequest('PUT (update)', req);

        if (entityCfg.base64Key) { req.params.id = genUts.atob(req.params.id); }
        let entityId = req.params.id;

        let customVld = this.customValidationParams('PUT', req, res, entityCfg);
        if (customVld) { return customVld; };

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityId);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.`)])
            );
        }

        customVld = this.customValidationDatabase('PUT', entityDB[index], res, entityCfg);
        if (customVld) { return customVld; };

        Object.keys(req.body).forEach((property) => {
            if (!entityCfg.keys.includes(property)) {
                entityDB[index][property] = req.body[property];
            }
        });

        fileUts.saveFile(fileName, entityCfg);

        return res.json(entityDB[index]);
    },

    delete(req, res, entityCfg, fileName) {
        this.logRequest('DELETE', req);

        if (entityCfg.base64Key) { req.params.id = genUts.atob(req.params.id); }
        let entityId = req.params.id;

        let customVld = this.customValidationParams('DELETE', req, res, entityCfg);
        if (customVld) { return customVld; };

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityId);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.`)])
            );
        }

        customVld = this.customValidationDatabase('DELETE', entityDB[index], res, entityCfg);
        if (customVld) { return customVld; };

        entityDB.splice(index, 1);

        fileUts.saveFile(fileName, entityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
    },

    customGet(req, res, entityCfg, customRoute) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let customVld = this.customValidationParams('GET', req, res, entityCfg);
        if (customVld) { return customVld; };

        let database = genUts.copyArray(entityCfg[customRoute.database]);
        let response = this.applyAllQueryFilters(database, req);

        customVld = this.customValidationDatabase('GET', response.items, res, entityCfg);
        if (customVld) { return customVld; };

        return this.makeCustomResponse(res, customRoute, response);
    },

    customPost(req, res, entityCfg, fileName, customRoute) {
        this.logRequest(`POST (${customRoute.name})`, req);

        let customVld = this.customValidationParams('POST', req, res, entityCfg);
        if (customVld) { return customVld; };

        let database = genUts.copyArray(entityCfg[customRoute.database]);
        let response = this.applyAllQueryFilters(database, req);

        if (req.body && Object.keys(req.body).length > 0) {
            entityCfg[customRoute.database].push(req.body);
            fileUts.saveFile(fileName, entityCfg);
        } else {
            customVld = this.customValidationDatabase('POST', response.items, res, entityCfg);
            if (customVld) { return customVld; };
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    customValidationParams(method, req, res, entityCfg) {
        if (!entityCfg.customValidation || entityCfg.customValidation.length === 0) {
            return null;
        }

        if (!req.params && !req.query && !req.body) {
            return null;
        }

        let errorList = [];
        let errorCustVld = null;

        entityCfg.customValidation.forEach(custVld => {
            let vldMethod = (!custVld.method || custVld.method.length === 0 || custVld.method.includes(method));
            let vldPathParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('pathParam'));
            let vldQueryParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('queryParam'));
            let vldPayload = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('payload'));

            if (vldMethod) {
                if (vldPathParam && req.params) {
                    errorCustVld = this.executeCustomValidation(req.params, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }

                if (vldQueryParam && req.query) {
                    errorCustVld = this.executeCustomValidation(req.query, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }

                if (vldPayload && req.body) {
                    errorCustVld = this.executeCustomValidation(req.body, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }
            }
        });

        if (errorList.length > 0) {
            return res.status(400).json(this.errorBuilderReturn(errorList));
        }

        return null;
    },

    customValidationDatabase(method, database, res, entityCfg) {
        if (!entityCfg.customValidation || entityCfg.customValidation.length === 0) {
            return null;
        }

        if (!database) { database = []; }
        if (!Array.isArray(database)) { database = [database]; }

        if (database.length === 0) {
            return null;
        }

        let errorList = [];
        let errorCustVld = null;

        entityCfg.customValidation.forEach(custVld => {
            let vldMethod = (!custVld.method || custVld.method.length === 0 || custVld.method.includes(method));
            let vldDatabase = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('database'));

            if (vldMethod && vldDatabase) {
                database.forEach(item => {
                    errorCustVld = this.executeCustomValidation(item, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                });
            }
        });

        if (errorList.length > 0) {
            return res.status(400).json(this.errorBuilderReturn(errorList));
        }

        return null;
    },

    executeCustomValidation(param, custVld) {
        let errorCustVld = [];

        if (custVld.operation === "required") {
            custVld.field.forEach(vldField => {
                if (custVld.value === "false") {
                    if (param[vldField]) { errorCustVld.push(this.makeCustomValidError(custVld, vldField)); }
                } else {
                    if (!param[vldField]) { errorCustVld.push(this.makeCustomValidError(custVld, vldField)); }
                }
            });
        } else {
            Object.keys(param).forEach((property) => {
                if (custVld.field.includes(property)) {
                    let paramValue = param[property];
                    let custValue = custVld.value;

                    if (typeof paramValue === 'string') { paramValue = paramValue.toUpperCase(); }
                    if (typeof custValue === 'string') { custValue = custValue.toUpperCase(); }

                    let custVldError = false;

                    if (custVld.operation === "=" && paramValue == custValue) { custVldError = true; }
                    if (custVld.operation === "!=" && paramValue != custValue) { custVldError = true; }
                    if (custVld.operation === ">" && paramValue > custValue) { custVldError = true; }
                    if (custVld.operation === ">=" && paramValue >= custValue) { custVldError = true; }
                    if (custVld.operation === "<" && paramValue < custValue) { custVldError = true; }
                    if (custVld.operation === "<=" && paramValue <= custValue) { custVldError = true; }
                    if (typeof paramValue === 'string') {
                        if (custVld.operation === "begins" && paramValue.startsWith(custValue)) { custVldError = true; }
                        if (custVld.operation === "!begins" && !paramValue.startsWith(custValue)) { custVldError = true; }
                        if (custVld.operation === "contains" && paramValue.includes(custValue)) { custVldError = true; }
                        if (custVld.operation === "!contains" && !paramValue.includes(custValue)) { custVldError = true; }
                    }

                    if (custVldError) { errorCustVld.push(this.makeCustomValidError(custVld, property)); }
                }
            });
        }

        if (errorCustVld.length === 0) {
            return null;
        }
        return errorCustVld;
    },

    makeCustomValidError(custVld, field) {
        return this.errorBuilder(400, `${custVld.msgError} (${field}).`, 
            `${custVld.msgError} (${field}). customValidation: ${custVld.name}.`);
    },

    getEntityKeyValue(entity, entityKeys) {
        let listValues = [];
        entityKeys.forEach(entityKey => {
            listValues.push(entity[entityKey]);
        });

        let entityKeyValue = listValues.join(";");

        if (typeof entityKeyValue === 'string') {
            entityKeyValue = entityKeyValue.toUpperCase();
        }
        return entityKeyValue;
    },

    entityKeyCompare(entity, entityKeys, id) {
        if (typeof id === 'string') {
            id = id.toUpperCase();
        }

        const entityKeyValue = this.getEntityKeyValue(entity, entityKeys);

        return entityKeyValue == id; // o "tipo" pode diferente, então usa "==" 
    },

    applyAllQueryFilters(dbConfig, req) {
        let database = genUts.copyArray(dbConfig);

        if (req.params) { database = dbUts.applyQueryFilter(database, req.params); }

        if (req.query) { database = dbUts.applyQueryFilter(database, req.query); }

        const { pageSize = 20, page = 1, order, fields } = req.query;
        const entitiesResponse = database.slice((page - 1) * pageSize, pageSize * page);

        if (fields) { dbUts.applyFields(entitiesResponse, fields); }

        if (order) { dbUts.applyOrder(entitiesResponse, order); }

        return {
            items: entitiesResponse,
            hasNext: database.length > (page * pageSize),
            total: entitiesResponse.length
        }
    },

    makeCustomResponse(res, customRoute, response) {
        let statusCodeResponse = 200;

        if (customRoute.responseType !== "array") {
            let database = response.items;
            database = database.length > 0 ? database[0] : {};

            statusCodeResponse = (database['statusCodeResponse']) || 200;

            if (database['errorResponse']) {
                response = this.errorBuilderReturn([this.errorBuilder(statusCodeResponse, database['errorResponse'])]);

            } else {
                response = database;
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    logRequest(method, req) {
        console.log(
            new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            '-', method,
            '- Path:', req.path,
            '- qryPrms:', req.query
        );
    },

    errorBuilder(cod, msg, help = null) {
        return {
            code: cod,
            message: msg,
            detailedMessage: help || msg
        }
    },

    errorBuilderReturn(errorList) {
        let errorReturn;
        let errorDetails;

        if (errorList.length === 1) {
            errorReturn = errorList[0];
            errorDetails = null;
        } else {
            errorReturn = this.errorBuilder(400, "Ocorreram vários erros, verifique os detalhes.");
            errorDetails = errorList;
        }

        if (errorDetails) { errorReturn["details"] = errorDetails; }

        return errorReturn;
    }
}