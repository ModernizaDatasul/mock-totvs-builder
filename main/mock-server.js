const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const fileUts = require('../utils/file-utils.js');
const methodCtrl = require('./method-control.js');

module.exports = {

    startMock(projRootDir) {
        const app = express();
        app.use(cors());
        app.use(express.json());

        const dataFile = this.readDataFile(path.join(projRootDir, 'data'));
        this.createRouters(app, dataFile);

        const server = http.Server(app);

        return server;
    },

    readDataFile(dataFile) {
        // Faz a Leitura das Configurações de cada Entidade
        const entitiesFiles = fileUts.readDir(dataFile);
        const entitiesData = [];

        entitiesFiles.forEach(entityFile => {
            entitiesData.push({
                fileName: entityFile,
                config: JSON.parse(fileUts.readFile(entityFile))
            });
        });

        return entitiesData;
    },

    createRouters(app, entitiesData) {
        // Index - Mostra todas a Entidades carregadas
        app.get('/', function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<meta charset="utf-8">');

            res.write('<style>');
            res.write('table { font-family: sans-serif; border-collapse: collapse; }');
            res.write('th { font-size: 20px; border: 2px solid #000000; text-align: left; padding: 8px; }');
            res.write('tr:first-child { background-color: #dddddd; }');
            res.write('tr:nth-child(even) { background-color: #EEE7DB; }');
            res.write('</style>');

            res.write('<h1>MOCK TOTVS BUILDER - No Ar !!<h1>');
            res.write('<h3>Entidades Configuradas<h3>');
            res.write('<table>');
            res.write('<tr>');
            res.write('<th>entityName</th>');
            res.write('<th>entityLabel</th>');
            res.write('<th>keys</th>');
            res.write('<th style="text-align: center">database</th>');
            res.write('</tr>');

            entitiesData.forEach(entityData => {
                const entityCfg = entityData.config;

                res.write('<tr>');
                res.write(`<th>${entityCfg.entityName}</th>`);
                res.write(`<th>${entityCfg.entityLabel || ''}</th>`);
                res.write(`<th>${entityCfg.keys}</th>`);
                res.write(`<th style="text-align: center">` +
                    `<a href="http://localhost:3000/${entityCfg.entityName}">[dados x${entityCfg.database.length}]</a></th>`);
                res.write('</tr>');
            });

            res.write('</table>');
            res.end();
        });

        // Configura as Rotas para cada Entidade
        entitiesData.forEach(entityData => {
            const fileName = entityData.fileName;
            const entityCfg = entityData.config;
            const entityPath = "/" + entityCfg.entityName;

            app.get(entityPath, function (req, res) {
                return methodCtrl.query(req, res, entityCfg);
            });

            app.get(entityPath + '/:id', function (req, res) {
                return methodCtrl.get(req, res, entityCfg);
            });

            app.post(entityPath, function (req, res) {
                return methodCtrl.create(req, res, entityCfg, fileName);
            });

            app.put(entityPath + '/:id', function (req, res) {
                return methodCtrl.update(req, res, entityCfg, fileName);
            });

            app.delete(entityPath + '/:id', function (req, res) {
                return methodCtrl.delete(req, res, entityCfg, fileName);
            });
        });
    }
}
