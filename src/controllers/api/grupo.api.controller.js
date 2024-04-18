const logger = require('../../config/logger.config').child({"process": "api"});

const { Op } = require("sequelize");

async function getGrupoById(req, res, db) {
    let idGrupo = Number(req.params.idGrupo);
    if (!Number.isInteger(idGrupo)) {
        res.status(400).send('Id suministrado no válido');
        return;
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
            res.status(404).send('Grupo no encontrado');
            await transaction.rollback();
            return;
        }

        const resultado = query_gru.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
      
    await transaction.commit();
}

async function getGrupoByCursoLetra(req, res, db) {
    
    let curso = Number(req.body.curso);
    if (!Number.isInteger(curso)) {
        res.status(400).send('Datos suministrados no válidos');
        return;
    }

    if (typeof req.body.letra != "string") {
        res.status(400).send('Datos suministrados no válidos');
        return;
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
            res.status(404).send('Grupo no encontrado');
            await transaction.rollback();
            return;
        }
    
        res.status(200).send(query_grupo.dataValues);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
    
    transaction.commit();
    return;
}

module.exports = {
    getGrupoById, getGrupoByCursoLetra
}