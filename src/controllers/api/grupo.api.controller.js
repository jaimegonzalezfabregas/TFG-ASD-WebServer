const logger = require('../../config/logger.config').child({"process": "api"});

const { Op } = require("sequelize");

async function getGrupoById(req, res, next, db) {
    let idGrupo = Number(req.params.idGrupo);
    if (!Number.isInteger(idGrupo)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Grupo for curso, letra');
        const query_gru = await db.sequelize.models.Grupo.findOne({
            attributes:['curso', 'letra'],
            where: {
                id: req.params.idGrupo
            }
        });

        if (query_gru == null || Object.keys(query_gru.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Grupo no encontrado';
            return next(err);
        }

        const resultado = query_gru.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
      
    await transaction.commit();
}

async function getGrupoByCursoLetra(req, res, next, db) {
    
    let curso = Number(req.body.curso);
    if (!Number.isInteger(curso)) {
        let err = {};
        err.status = 400;
        err.message = 'Datos suministrados no válidos';
        return next(err);
    }

    if (typeof req.body.letra != "string") {
        let err = {};
        err.status = 400;
        err.message = 'Datos suministrados no válidos';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();

    try {
        const query_grupo = await db.sequelize.models.Grupo.findOne({
            attributes: ['id'],
            where: {
                curso: curso,
                letra: req.body.letra
            }
        });
    
        if (query_grupo == null || Object.keys(query_grupo.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Grupo no encontrado';
            return next(err);
        }
    
        res.status(200).send(query_grupo.dataValues);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
    
    transaction.commit();
    return;
}

module.exports = {
    getGrupoById, getGrupoByCursoLetra
}