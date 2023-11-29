const sqlite = require('sqlite3')
const { Sequelize, DataTypes } = require('sequelize')

async function main() {

    const db = new sqlite.Database('db_mockbase.db');
    

    const seq = new Sequelize({dialect: 'sqlite', database: 'db_mockbase.db'});

    try {
        await seq.authenticate();
        console.log('Connection established.');
    } catch (error) {
        console.error('Conection not established:', error);
    }

    await seq.sync();

    const m1 = seq.define('M1', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        extra: {
            type: DataTypes.STRING
        }
    });

    await m1.sync();

    await m1.create({extra:'Something here'});

    const build = m1.build({extra:'Something here too'});
    await build.save();

    const q1 = await m1.findAll();
    console.log("query with first connection:");
    for (x of q1) {
        console.log(x.dataValues);
    }

    await seq.sync();
    await seq.close();

    const seqx = new Sequelize({dialect: 'sqlite', database: 'db_mockbase.db'});

    try {
        await seqx.authenticate();
        console.log('Connection established.');
    } catch (error) {
        console.error('Conection not established:', error);
    }

    await seqx.sync();

    const m1x = seqx.define('M1', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        extra: {
            type: DataTypes.STRING
        }
    });

    await m1x.sync();

    const q2 = await m1x.findAll();
    console.log("query with second connection:" + q2);
}

main();