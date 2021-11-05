const genUts = require('../utils/generic-utils.js');
const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    query(req, res, entityCfg) {
        this.logRequest('GET (query)', req);

        let customVld = this.customValidationParams('GET', 'query', req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = this.applyAllQueryFilters(entityCfg.database, req, entityCfg.searchField);

        return res.json(response);
    },

    get(req, res, entityCfg) {
        this.logRequest('GET', req);

        if (entityCfg.base64Key) { req.params.id = genUts.atob(req.params.id); }
        let entityId = req.params.id;

        let customVld = this.customValidationParams('GET', 'get', req, res, entityCfg);
        if (customVld) { return customVld; };

        const entityResponse = entityCfg.database.find((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityId);
        });

        if (!entityResponse) {
            return res.status(400).json(
                { error: `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.` }
            );
        }

        customVld = this.customValidationDatabase('GET', 'get', entityResponse, res, entityCfg);
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

        let customVld = this.customValidationParams('POST', 'create', req, res, entityCfg);
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

        let customVld = this.customValidationParams('PUT', 'update', req, res, entityCfg);
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

        customVld = this.customValidationDatabase('PUT', 'update', entityDB[index], res, entityCfg);
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

        let customVld = this.customValidationParams('DELETE', 'delete', req, res, entityCfg);
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

        customVld = this.customValidationDatabase('DELETE', 'delete', entityDB[index], res, entityCfg);
        if (customVld) { return customVld; };

        entityDB.splice(index, 1);

        fileUts.saveFile(fileName, entityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
    },

    customGet(req, res, entityCfg, customRoute) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let customVld = this.customValidationParams('GET', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = {};
        if (customRoute.database) {
            let database = genUts.copyArray(entityCfg[customRoute.database]);
            response = this.applyAllQueryFilters(database, req, entityCfg.searchField);

            customVld = this.customValidationDatabase('GET', customRoute.name, response.items, res, entityCfg);
            if (customVld) { return customVld; };
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    customGetScript(req, res, entityCfg, customRoute, projRootDir) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let customVld = this.customValidationParams('GET', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let arqScript = fileUts.pathJoin(projRootDir, 'data');
        arqScript = fileUts.pathJoin(arqScript, customRoute.script);

        if (!fileUts.pathExist(arqScript)) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorBuilder(500, `Script da Rota não encontrado: ${arqScript}`)])
            );
        }

        let database = genUts.copyArray(entityCfg[customRoute.database]);
        let customScript = null;
        let responseScript = null;

        try {
            customScript = require(arqScript);
            responseScript = customScript.get(req.params, req.query, database);
        }
        catch (errorScript) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorTryCatchBuilder(500, 'Erro ao executar o Script da Rota !', errorScript)])
            );
        }

        let statusCodeResponse = 200;
        let response = {};
        if (responseScript) {
            if (responseScript.statusCode) { statusCodeResponse = responseScript.statusCode };
            if (responseScript.response) { response = responseScript.response };
        }

        return res.status(statusCodeResponse).json(response);
    },

    customGetFile(req, res, entityCfg, customRoute) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let customVld = this.customValidationParams('GET', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let fileName = null;
        if (req.params) {
            Object.keys(req.params).forEach((param) => { fileName = req.params[param]; });
        }

        if (!fileName) {
            return res.status(404).json(
                this.errorBuilderReturn([this.errorBuilder(404, 'O nome do Arquivo deve ser informado !')])
            );
        }

        let fileDir = null;
        if (customRoute.fileParam && customRoute.fileParam.directory) {
            fileDir = customRoute.fileParam.directory;
        }

        let fileArq = null;
        if (fileName && fileDir) {
            fileArq = fileUts.pathJoin(fileDir, fileName);

            if (fileUts.pathExist(fileArq)) {
                fileArq = fileUts.pathFull(fileArq);
            } else {
                fileArq = null;
            }
        }

        if (!fileArq) {
            return res.status(404).json(
                this.errorBuilderReturn([this.errorBuilder(404, `Arquivo ${fileName} não encontrado, no caminho ${fileDir} !`)])
            );
        }

        return this.makeCustomResponse(res, customRoute, fileArq);
    },

    customPost(req, res, entityCfg, fileName, customRoute) {
        this.logRequest(`POST (${customRoute.name})`, req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = {};
        if (customRoute.database) {
            let database = genUts.copyArray(entityCfg[customRoute.database]);
            response = this.applyAllQueryFilters(database, req, entityCfg.searchField);

            if (req.body && Object.keys(req.body).length > 0) {
                entityCfg[customRoute.database].push(req.body);
                fileUts.saveFile(fileName, entityCfg);
            } else {
                customVld = this.customValidationDatabase('POST', customRoute.name, response.items, res, entityCfg);
                if (customVld) { return customVld; };
            }
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    customPostScript(req, res, entityCfg, fileName, customRoute, projRootDir) {
        this.logRequest(`POST (${customRoute.name})`, req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let arqScript = fileUts.pathJoin(projRootDir, 'data');
        arqScript = fileUts.pathJoin(arqScript, customRoute.script);

        if (!fileUts.pathExist(arqScript)) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorBuilder(500, `Script da Rota não encontrado: ${arqScript}`)])
            );
        }

        let database = genUts.copyArray(entityCfg[customRoute.database]);
        let customScript = null;
        let responseScript = null;

        try {
            customScript = require(arqScript);
            responseScript = customScript.post(req.params, req.query, req.body, database);
        }
        catch (errorScript) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorTryCatchBuilder(500, 'Erro ao executar o Script da Rota !', errorScript)])
            );
        }

        let statusCodeResponse = 200;
        let response = {};
        if (responseScript) {
            if (responseScript.statusCode) { statusCodeResponse = responseScript.statusCode };
            if (responseScript.response) { response = responseScript.response };
            if (responseScript.database) {
                entityCfg[customRoute.database] = responseScript.database;
                fileUts.saveFile(fileName, entityCfg);
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    customPostUpload(req, res, entityCfg, fileName, customRoute) {
        this.logRequest(`POST (${customRoute.name})`, req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let uploadFile = {
            originalName: req.file.originalname,
            size: req.file.size,
            destination: req.file.destination,
            fileName: req.file.filename
        }

        if (customRoute.database) {
            entityCfg[customRoute.database].push(uploadFile);
            fileUts.saveFile(fileName, entityCfg);
        }

        return this.makeCustomResponse(res, customRoute, { items: [uploadFile] });
    },

    customValidationParams(method, route, req, res, entityCfg) {
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
            let vldRoute = (!custVld.route || custVld.route.length === 0 || custVld.route.includes(route));
            let vldPathParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('pathParam'));
            let vldQueryParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('queryParam'));
            let vldPayload = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('payload'));

            if (vldMethod && vldRoute) {
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

    customValidationDatabase(method, route, database, res, entityCfg) {
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
            let vldRoute = (!custVld.route || custVld.route.length === 0 || custVld.route.includes(route));
            let vldDatabase = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('database'));

            if (vldMethod && vldRoute && vldDatabase) {
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

    applyAllQueryFilters(dbConfig, req, searchField) {
        let database = genUts.copyArray(dbConfig);
        let fromTo = (searchField) ? { search: searchField } : null;

        if (req.params) { database = dbUts.applyQueryFilter(database, req.params, fromTo); }

        if (req.query) { database = dbUts.applyQueryFilter(database, req.query, fromTo); }

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

        if (customRoute.responseType !== "array" && customRoute.responseType !== "file") {
            let database = response.items || [];
            database = database.length > 0 ? database[0] : {};

            statusCodeResponse = (database['statusCodeResponse']) || 200;

            if (database['errorResponse']) {
                response = this.errorBuilderReturn([this.errorBuilder(statusCodeResponse, database['errorResponse'])]);
            } else {
                response = database;
            }
        }

        if (customRoute.responseType === "file") {
            return res.status(statusCodeResponse).sendFile(response);
        } else {
            return res.status(statusCodeResponse).json(response);
        }
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

    errorTryCatchBuilder(cod, msg, error) {
        let descError = null;
        if (error.name) { descError = error.name; }
        if (error.message) { descError = `${descError} - ${error.message}`; }
        if (error.stack) { descError = `${descError} - ${error.stack}`; }

        return {
            code: cod,
            message: msg,
            detailedMessage: descError || msg
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