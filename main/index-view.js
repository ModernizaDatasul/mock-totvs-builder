module.exports = {

    showIndex(req, res, entitiesData) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<meta charset="utf-8">');

        res.write('<style>');
        res.write(' table { font-family: sans-serif; border-collapse: collapse; }');
        res.write(' th { font-size: 15px; border: 2px solid #000000; text-align: left; padding: 8px; }');
        res.write(' td { font-size: 14px; border: 2px solid #000000; text-align: left; padding: 8px; }');
        res.write(' tr:nth-child(even) { background-color: #EEE7DB; }');
        res.write(' tr:first-child { background-color: #dddddd; }');
        res.write('</style>');

        res.write('<h1>MOCK TOTVS BUILDER - No Ar !!<h1>');

        this.showIntities(res, entitiesData);

        const qryParams = req.query;
        if (qryParams && qryParams.entity && qryParams.config) {
            const entityData = entitiesData.find((item) => {
                return item.config.entityName === qryParams.entity;
            });
            const entityConfig = entityData.config;

            res.write(`<h2>Entidade: ${qryParams.entity} (${qryParams.config})<h2>`);

            if (qryParams.config === 'routes') {
                this.showRoutes(req, res, entityConfig);
            } else {
                this.tableView(res, qryParams.config, entityConfig[qryParams.config]);
            }
        }

        res.end();
    },

    showIntities(res, entitiesData) {
        res.write('<h3>Entidades Configuradas:<h3>');

        res.write('<table>');
        res.write(' <tr>');
        res.write('  <th>entityName</th>');
        res.write('  <th>entityLabel</th>');
        res.write('  <th>keys</th>');
        res.write('  <th style="text-align: center">keysSep</th>');
        res.write('  <th>mainPath</th>');
        res.write('  <th>custSearchFld</th>');
        res.write('  <th>b64Key</th>');
        res.write('  <th style="text-align: center">children</th>');
        res.write('  <th style="text-align: center">routes</th>');
        res.write('  <th style="text-align: center">customVld</th>');
        res.write('  <th style="text-align: center">database</th>');
        res.write(' </tr>');

        entitiesData.forEach(entityData => {
            const entityCfg = entityData.config;
            const urlIndex = `http://localhost:3000?entity=${entityCfg.entityName}`;

            let qtdRoutesDefauts = 5;
            if (entityCfg.children) {
                qtdRoutesDefauts = qtdRoutesDefauts + (entityCfg.children.length * 5);
            }

            res.write(' <tr>');
            res.write(`  <td>${entityCfg.entityName}</td>`);
            res.write(`  <td>${entityCfg.entityLabel || ''}</td>`);
            res.write(`  <td>${JSON.stringify(entityCfg.keys)}</td>`);
            res.write(`  <td style="text-align: center">${entityCfg.keys.length > 1 ? entityCfg.keysSeparator || ';' : ''}</td>`);
            res.write(`  <td>${entityCfg.mainPath || ''}</td>`);
            res.write(`  <td>${JSON.stringify(entityCfg.customSearchFields) || ''}</td>`);
            res.write(`  <td>${entityCfg.base64Key || false}</td>`);
            res.write('  <td style="text-align: center">');
            res.write(`   <a href="${urlIndex}&config=children">`);
            res.write(`    [children x${entityCfg.children ? entityCfg.children.length : 0}]`);
            res.write('   </a>');
            res.write('  </td>');
            res.write('  <td style="text-align: center">');
            res.write(`   <a href="${urlIndex}&config=routes">`);
            res.write(`    [rotas x${entityCfg.customRoutes ? entityCfg.customRoutes.length + qtdRoutesDefauts : qtdRoutesDefauts}]`);
            res.write('   </a>');
            res.write('  </td>');
            res.write('  <td style="text-align: center">');
            res.write(`   <a href="${urlIndex}&config=customValidation">`);
            res.write(`    [valids x${entityCfg.customValidation ? entityCfg.customValidation.length : 0}]`);
            res.write('   </a>');
            res.write('  </td>');
            res.write('  <td style="text-align: center">');
            res.write(`   <a href="${urlIndex}&config=database">`);
            res.write(`    [dados x${entityCfg.database.length}]`);
            res.write('   </a>');
            res.write('  </td>');
            res.write(' </tr>');
        });

        res.write('</table>');
    },

    showRoutes(req, res, entityCfg) {
        const entityRoutes = [];

        this.addRouteDefault(entityRoutes, "CRUD", "query", "GET", "", false, "array", JSON.stringify(entityCfg.queryCustomInf));
        this.addRouteDefault(entityRoutes, "CRUD", "get", "GET", "/:id", false, "object", null);
        this.addRouteDefault(entityRoutes, "CRUD", "create", "POST", "", true, "object", null);
        this.addRouteDefault(entityRoutes, "CRUD", "update", "PUT", "/:id", true, "object", null);
        this.addRouteDefault(entityRoutes, "CRUD", "delete", "DELETE", "/:id", false, "object", null);

        if (entityCfg.children) {
            entityCfg.children.forEach((children) => {
                this.addRouteDefault(entityRoutes, "CHILDREN", "query", "GET", "/:idFather/" + children.entityName, false, "array", null);
                this.addRouteDefault(entityRoutes, "CHILDREN", "get", "GET", "/:idFather/" + children.entityName + "/:idSon", false, "object", null);
                this.addRouteDefault(entityRoutes, "CHILDREN", "create", "POST", "/:idFather/" + children.entityName, true, "object", null);
                this.addRouteDefault(entityRoutes, "CHILDREN", "update", "PUT", "/:idFather/" + children.entityName + "/:idSon", true, "object", null);
                this.addRouteDefault(entityRoutes, "CHILDREN", "delete", "DELETE", "/:idFather/" + children.entityName + "/:idSon", false, "object", null);
            });
        }

        if (entityCfg.customRoutes) {
            entityCfg.customRoutes.forEach((customRoute) => {
                entityRoutes.push({
                    type: "CUSTOM", name: customRoute.name, method: customRoute.method,
                    path: customRoute.path, savePayload: customRoute.savePayload, script: customRoute.script,
                    fileParam: JSON.stringify(customRoute.fileParam),
                    responseType: customRoute.responseType, database: customRoute.database,
                    queryCustomInf: JSON.stringify(customRoute.queryCustomInf)
                });
            });
        }

        res.write('<table>');
        res.write(' <tr>');
        res.write('  <th>type</th>');
        res.write('  <th>name</th>');
        res.write('  <th style="text-align: center">method</th>');
        res.write('  <th>path</th>');
        res.write('  <th>savePyld</th>');
        res.write('  <th>script</th>');
        res.write('  <th>fileParam</th>');
        res.write('  <th>responseType</th>');
        res.write('  <th>queryCustomInf</th>');
        res.write('  <th style="text-align: center">database</th>');
        res.write(' </tr>');

        entityRoutes.forEach((entityRoute) => {
            let dbRoute = entityCfg[entityRoute.database] || [];
            let urlIndex = `http://localhost:3000?entity=${entityCfg.entityName}&config=routes`;
            urlIndex = `${urlIndex}&route=${entityRoute.name}`;

            res.write(' <tr>');
            res.write(`  <td>${entityRoute.type}</td>`);
            res.write(`  <td>${entityRoute.name}</td>`);
            res.write(`  <td style="text-align: center">${entityRoute.method}</td>`);
            res.write(`  <td>${entityCfg.mainPath}${entityRoute.path}</td>`);
            res.write(`  <td>${entityRoute.savePayload || false}</td>`);
            res.write(`  <td>${entityRoute.script || ''}</td>`);
            res.write(`  <td>${entityRoute.fileParam || ''}</td>`);
            res.write(`  <td>${entityRoute.responseType || 'object'}</td>`);
            res.write(`  <td>${entityRoute.queryCustomInf || ''}</td>`);
            res.write('  <td style="text-align: center">');
            if (entityRoute.database) {
                res.write(`   <a href="${urlIndex}&database=${entityRoute.database}">`);
                res.write(`    [${entityRoute.database} x${dbRoute.length}]`);
                res.write('   </a>');
            }
            res.write('  </td>');
            res.write(' </tr>');
        });

        res.write('</table>');

        if (req.query.database) {
            res.write(`<h2>Route: ${req.query.route} (${req.query.database})<h2>`);
            this.tableView(res, req.query.database, entityCfg[req.query.database]);
        }
    },

    addRouteDefault(entityRoutes, type, name, method, path, savePayload, responseType, queryCustomInf) {
        entityRoutes.push({
            type: type, name: name, method: method, path: path,
            savePayload: savePayload, responseType: responseType,
            database: "database", queryCustomInf: queryCustomInf
        });
    },

    tableView(res, configParam, configParamValue) {
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
    }
}