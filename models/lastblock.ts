"use strict";
/* tslint:disable:variable-name */
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(sequelize, dataTypes) {
    let LastBlock = sequelize.define("LastBlock", {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: dataTypes.INTEGER
        },
        lastBlock: {
            type: dataTypes.BIGINT,
            allowNull: false
        },
        createdAt: {
            allowNull: false,
            type: dataTypes.DATE
        },
        updatedAt: {
            allowNull: false,
            type: dataTypes.DATE
        }
    }, {
        indexes: [],
        classMethods: {},
        timestamps: true
    });
    return LastBlock;
}
exports.default = default_1;
