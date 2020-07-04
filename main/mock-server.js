const express = require('express');
const multer = require('multer');
const http = require('http');
const cors = require('cors');
const path = require('path');

const methodCtrl = require('./method-control.js');
const indexView = require('./index-view.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    startMock(projRootDir) {
        const app = express();
        app.use(cors());
        app.use(express.json());

        const dataFile = this.readDataFile(path.join(projRootDir, 'data'));

        if (!this.validEntitiesData(dataFile)) { return null; }
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
                config: JSON.parse(fileUts.readFileString(entityFile))
            });
        });

        return entitiesData;
    },

    validEntitiesData(entitiesData) {

        // Em desenvolvimento - Fazer a validação os arquivos

        return true;
    },

    createRouters(app, entitiesData) {
        // Index - Mostra todas a Entidades carregadas
        this.makeIndexRoute(app, entitiesData);

        // Configura as Rotas para cada Entidade
        entitiesData.forEach(entityData => {
            this.makeCustomRoute(app, entityData.fileName, entityData.config);
            this.makeCRUDRoute(app, entityData.fileName, entityData.config);
        });
    },

    makeIndexRoute(app, entitiesData) {
        app.get('/', function (req, res) {
            return indexView.showIndex(req, res, entitiesData);
        });
    },

    makeCRUDRoute(app, fileName, entityCfg) {
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
    },

    makeCustomRoute(app, fileName, entityCfg) {
        if (!entityCfg.customRoutes) { return; }
        if (entityCfg.customRoutes.length === 0) { return; }

        entityCfg.customRoutes.forEach(customRoute => {
            const customPath = `/${entityCfg.entityName}${customRoute.path}`;

            switch (customRoute.method.toUpperCase()) {
                case 'GET':
                    if (customRoute.responseType && customRoute.responseType === "file") {
                        app.get(customPath, function (req, res) {
                            return methodCtrl.customGetFile(req, res, entityCfg, customRoute);
                        });
                    } else {
                        app.get(customPath, function (req, res) {
                            return methodCtrl.customGet(req, res, entityCfg, customRoute);
                        });
                    }
                    break;
                case 'POST':
                    if (customRoute.fileParam) {
                        const upload = this.makeUploadConfig(customRoute.fileParam);

                        app.post(customPath, upload.single('files'), function (req, res) {
                            return methodCtrl.customPostUpload(req, res, entityCfg, fileName, customRoute);
                        });
                    } else {
                        app.post(customPath, function (req, res) {
                            return methodCtrl.customPost(req, res, entityCfg, fileName, customRoute);
                        });
                    }
                    break;
                default:
                    console.log('customRoutes: Método Inválido -', customRoute.method);
            }
        });
    },

    makeUploadConfig(fileParam) {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, fileParam.directory);
            },
            filename: function (req, file, cb) {
                let fileName = file.originalname;

                if (fileParam.fileName) {
                    let extName = path.extname(file.originalname);

                    fileName = fileParam.fileName;
                    fileName = fileName.replace("#file#", file.originalname.replace(extName, ''));
                    fileName = fileName.replace("#now#", Date.now().toString());

                    let dtToday = new Date();
                    let sDay = dtToday.getDate() < 10 ? `0${dtToday.getDate()}` : `${dtToday.getDate()}`;
                    let sMonth = dtToday.getMonth() < 9 ? `0${dtToday.getMonth() + 1}` : `${dtToday.getMonth() + 1}`;
                    fileName = fileName.replace("#today#", `${dtToday.getFullYear()}-${sMonth}-${sDay}`);

                    if (req.params) {
                        Object.keys(req.params).forEach((key) => {
                            fileName = fileName.replace(`#${key}#`, req.params[key]);
                        });
                    }

                    fileName = `${fileName}${extName}`;
                }

                cb(null, fileName);
            }
        });

        return multer({ storage });
    }
}
