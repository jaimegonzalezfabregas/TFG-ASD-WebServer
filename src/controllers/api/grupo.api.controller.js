const { Op } = require("sequelize");

async function getGrupoById(req, res, db) {
    try {
        idGrupo = Number(req.params.idGrupo);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Grupo for curso, letra');
        const query_gru = await db.sequelize.models.Grupo.findOne({
            attributes:['curso', 'letra'],
            where: {
                id: req.params.idGrupo
            }
        });

        if (Object.keys(query_gru.dataValues).length == 0) {
            res.status(404).send('Grupo no encontrado');
            await transaction.rollback();
            return;
        }

        const resultado = query_gru.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
      
    await transaction.commit();
}

async function getGrupoByCursoLetra(req, res, db) {
    try {
        curso = Number(req.body.curso);
    }
    catch (error) {
        res.status(400).send('Datos suministrados no válidos');
        return;
    }

    if (typeof req.body.grupo != "string") {
        res.status(400).send('Datos suministrados no válidos');
        return;
    }

    const transaction = db.sequelize.transaction();

    const query_grupo = grupo.findOne({
        attributes: ['id'],
        where: {
            curso: curso,
            letra: req.body.grupo
        }
    });

    if (Object.keys(query_grupo.dataValues).length == 0) {
        res.status(404).send('Grupo no encontrado');
        transaction.rollback();
        return;
    }

    res.status(200).send(query_grupo.dataValues);
    transaction.rollback();
    return;
}

module.exports = {
    getGrupoById, getGrupoByCursoLetra
}