const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const { verificaToken, verificaAdminRole } = require('../middlewares/autenticacion');
const app = express();

app.get('/usuario', verificaToken, (req, res) => { //VerificaToken es el middleware

    let desde = Number(req.query.desde) || 0;
    let limite = Number(req.query.limite) || 5;

    Usuario.find({ estado: true }, 'nombre email role estado img')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            } else {
                Usuario.countDocuments({ estado: true }, (err, conteo) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }
                    return res.json({
                        ok: true,
                        usuarios,
                        conteo
                    });
                });
            }
        });

});

app.post('/usuario', [verificaToken, verificaAdminRole], function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    usuario.save((err, usuario) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        } else {
            return res.json({
                ok: true,
                usuario
            });
        }
    });

});


app.put('/usuario/:id', [verificaToken, verificaAdminRole], function(req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        } else {
            return res.json({
                ok: true,
                usuario: usuarioDB
            });
        }
    });
});

app.delete('/usuario/:id', [verificaToken, verificaAdminRole], function(req, res) {
    let id = req.params.id;

    //Usuario.findByIdAndRemove(id, (err, borrado) => {
    Usuario.findByIdAndUpdate(id, { estado: false }, { new: true }, (err, borrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!borrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado.'
                }
            });
        }

        res.json({
            ok: true,
            usuario: borrado
        });
    });
});

module.exports = app;