const genUts = require('../utils/generic-utils.js');
const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    entityConfig(req, res, entityCfg) {
        this.logRequest('GET (entityCfg)', req);

        let response = entityCfg;

        const configParam = req.query.config;

        if (req.query && configParam) {
            response = {};
            if (req.query.tableView) {
                this.tableView(res, entityCfg.entityName, configParam, entityCfg[configParam]);
                return;
            } else {
                response[configParam] = entityCfg[configParam];
            }
        }

        return res.json(response);
    },

    query(req, res, entityCfg) {
        this.logRequest('GET (query)', req);

        let response = this.applyAllQueryFilters(entityCfg.database, req);

        return res.json(response);
    },

    get(req, res, entityCfg) {
        this.logRequest('GET', req);

        let id = req.params.id;
        if (entityCfg.base64Key) { id = genUts.atob(id); }

        const entityResponse = entityCfg.database.find((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, id);
        });

        if (!entityResponse) {
            return res.status(400).json(
                { error: `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${id}` }
            );
        }

        return res.json(entityResponse);
    },

    create(req, res, entityCfg, fileName) {
        this.logRequest('POST (create)', req);

        const entityDB = entityCfg.database;
        const newEntity = req.body;

        const id = this.getEntityKeyValue(newEntity, entityCfg.keys);

        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, id);
        });

        if (index !== -1) {
            return res.status(400).json(
                this.errorBuilder(400, `Já existe ${entityCfg.entityLabel || entityCfg.entityName} com o código ${id}`)
            );
        }

        entityDB.push(newEntity);

        fileUts.saveFile(fileName, entityCfg);

        return res.json(newEntity);
    },

    update(req, res, entityCfg, fileName) {
        this.logRequest('PUT (update)', req);

        let id = req.params.id;
        if (entityCfg.base64Key) { id = genUts.atob(id); }

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, id);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilder(400, `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${id}`)
            );
        }

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

        let id = req.params.id;
        if (entityCfg.base64Key) { id = genUts.atob(id); }

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, id);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilder(400, `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${id}`)
            );
        }

        entityDB.splice(index, 1);

        fileUts.saveFile(fileName, entityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
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

    customGet(req, res, entityCfg, customRoute) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let database = genUts.copyArray(entityCfg[customRoute.database]);

        let response = this.applyAllQueryFilters(database, req);

        return this.makeCustomResponse(res, customRoute, response);
    },

    customPost(req, res, entityCfg, fileName, customRoute) {
        this.logRequest(`POST (${customRoute.name})`, req);

        if (req.body && Object.keys(req.body).length > 0) {
            entityCfg[customRoute.database].push(req.body);
            fileUts.saveFile(fileName, entityCfg);
        }

        let database = genUts.copyArray(entityCfg[customRoute.database]);

        let response = this.applyAllQueryFilters(database, req);

        return this.makeCustomResponse(res, customRoute, response);
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
                response = this.errorBuilder(statusCodeResponse, database['errorResponse']);
            } else {
                response = database;
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    tableView(res, entityName, configParam, configParamValue) {
        if (typeof configParamValue !== 'object') {
            let newObj = {};
            newObj[configParam] = configParamValue;
            configParamValue = newObj;
        }

        if (!Array.isArray(configParamValue)) { configParamValue = [configParamValue]; }

        let header = [];
        configParamValue.forEach((value, idx) => {
            if (typeof value !== 'object') {
                let newObj = {};
                newObj[configParam] = value;
                value = newObj;
                configParamValue[idx] = value;
            }
            header = header.concat(Object.keys(value).filter(key => header.indexOf(key) < 0));
        });

        let lines = [];
        configParamValue.forEach(value => {
            let reg = [];
            header.forEach((key) => {
                reg.push(value[key]);
            });
            lines.push(reg);
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<meta charset="utf-8">');

        res.write('<style>');
        res.write(' table { font-family: sans-serif; border-collapse: collapse; }');
        res.write(' th { font-size: 15px; border: 2px solid #000000; text-align: left; padding: 8px; }');
        res.write(' td { font-size: 14px; border: 2px solid #000000; text-align: left; padding: 8px; }');
        res.write(' tr:nth-child(even) { background-color: #EEE7DB; }');
        res.write(' tr:first-child { background-color: #dddddd; }');
        res.write('</style>');

        res.write(`<h2>Entidade: ${entityName}<h2>`);
        res.write(`<h3>Parâmetro: ${configParam}<h3>`);
        res.write('<table>');

        res.write(' <tr>');
        header.forEach(title => {
            res.write(`  <th>${title}</th>`);
        });
        res.write(' </tr>');

        lines.forEach(line => {
            res.write(' <tr>');
            line.forEach(reg => {
                if (typeof reg === 'object') { reg = JSON.stringify(reg) };
                res.write(`  <td>${(reg === undefined) ? '' : reg}</td>`);
            });
            res.write(' </tr>');
        });

        res.write('</table>');
        res.end();
    },

    logRequest(method, req) {
        console.log(
            new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            '-', method,
            '- Path:', req.path,
            '- qryPrms:', req.query
        );
    },

    errorBuilder(cod, msg) {
        return {
            code: cod,
            message: msg,
            detailedMessage: msg
        }
    }
}