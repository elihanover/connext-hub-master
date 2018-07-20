"use strict";
/* tslint:disable:variable-name */
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(sequelize, dataTypes) {
    let VCStateUpdate = sequelize.define("VCStateUpdate", {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: dataTypes.INTEGER
        },
        ts: {
            type: dataTypes.BIGINT,
            allowNull: false
        },
        eventType: {
            type: dataTypes.STRING,
            allowNull: false
        },
        vcid: {
            type: dataTypes.STRING,
            allowNull: false
        },
        nonce: {
            type: dataTypes.INTEGER,
            allowNull: false
        },
        fields: {
            type: dataTypes.JSONB,
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
    return VCStateUpdate;
}
exports.default = default_1;
