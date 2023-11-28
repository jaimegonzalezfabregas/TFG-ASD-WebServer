const sqlite = require('sqlite3')
const { Sequelize, DataTypes, Model } = require('sequelize')

async function main() {

    const db = new sqlite.Database('db_mockbase');
    

    const seq = new Sequelize({dialect: 'sqlite', database: 'db_mockbase'});

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

    m1.build({extra:'Something here too'});
    await m1.save();

    await seq.sync();
    await seq.close();
}

async function queries() {
    const seq = new Sequelize({dialect: 'sqlite', database: 'db_mockbase'});

    await seq.sync();

    const m1 = sequelize.models.m1;

    await m1.sync();

    console.log((await m1.findAll).dataValues);
}

main();
queries();