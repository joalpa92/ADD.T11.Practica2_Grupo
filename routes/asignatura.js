const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignatura');
const Usuario = require('../models/usuario'); // Modelo de usuarios
const Estudio = require('../models/estudio'); // Modelo de estudios
const nodemailer = require('nodemailer'); //nuevo

//El transporter
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth:{
        user: 'app.p2.add@gmail.com',
        pass: 'xktw fenm lhrk soha'
    }
});

//Obtener asignaturas
router.get('/asignaturas', isAuthenticated, async (req, res) => {
    const asignatura = new Asignatura();
    const asignaturas = await asignatura.findAllFromUsuario(req.user);
    console.log("Lo que encuentra enfindAllFromUsuario" + asignatura)
    const usuarios = await Usuario.find(); // Obtiene todos los usuarios
    // Filtrar profesores y alumnos
    const profesores = usuarios.filter(user => user.rol === 'Profesor');
    const alumnos = usuarios.filter(user => user.rol === 'Alumno');
    const estudios = await Estudio.find(); // Obtiene todos los estudios
    res.render('asignaturas', { asignaturas, profesores, alumnos, estudios });
});


//Con este enviamos a la BDD cuando clicamos en añadir del formulario
router.post('/asignatura/add', async (req, res) => {
    try {
        const { nombre, curso, alumnos, profesores, estudio } = req.body;

        // Crear la asignatura con los datos del formulario
        const nuevaAsignatura = new Asignatura({
            nombre,
            curso,
            alumnos: Array.isArray(alumnos) ? alumnos : [alumnos], // Asegurar que sea un array
            profesores: Array.isArray(profesores) ? profesores : [profesores],
            estudio
        });

        await nuevaAsignatura.save();
        res.redirect('/asignaturas'); // Redirigir tras guardar
    } catch (error) {
        console.error('Error al guardar asignatura:', error);
        res.status(500).send('Error al guardar la asignatura');
    }
});

//Ruta para eliminar una asignatura por su id
router.get('/asignaturas/delete/:id', isAuthenticated, async (req, res, next) => {
    if (req.user.rol === "Administrador" || req.user.rol === "Profesor") {//cotenido añadido condicional para evitar entradas indeseadas
        const asignatura = new Asignatura();
        let { id } = req.params;
        console.log("Intentando eliminar asignatura con ID:", id); //Trazas para pruebas
        await asignatura.delete(id);
        res.redirect('/asignaturas');
    } else {
        res.redirect('/')
    }
});

router.get('/asignaturas/editAsignatura/:id', isAuthenticated, async (req, res, next) => {
    if (req.user.rol === "Administrador" || req.user.rol === "Profesor") {//cotenido añadido condicional para evitar entradas indeseadas
        var asignatura = new Asignatura();
        asignatura = await asignatura.findById(req.params.id);
        const usuarios = await Usuario.find(); // Obtiene todos los usuarios
        console.log("Jorge, esto funciona")
        // Filtrar profesores y alumnos
        const profesores = usuarios.filter(user => user.rol === 'Profesor');
        const alumnos = usuarios.filter(user => user.rol === 'Alumno');
        const estudios = await Estudio.find(); // Obtiene todos los estudios

        res.render('editAsignatura', { asignatura, usuarios, profesores, alumnos, estudios });
    } else {
        res.redirect('/')
    }
});

//post para editAsignatura
router.post('/asignaturas/editAsignatura/:id', isAuthenticated, async (req, res, next) => {
    if (req.user.rol === "Administrador" || req.user.rol === "Profesor") {//cotenido añadido condicional para evitar entradas indeseadas
        const asignatura = new Asignatura();
        const { id } = req.params;
        await asignatura.update({ _id: id }, req.body);
    
    //Cada vez que haya un cambio en una asignatura, los alumnos de la asignatura reciben una notificación 
    const asignaturaActualizada = await Asignatura.findById(id).populate('alumnos');
    //Obtener los emails de los alumnos en un array
    let emails = [];
    for (let i = 0; i < asignaturaActualizada.alumnos.length; i++) {
        if (asignaturaActualizada.alumnos[i].email) { 
            emails.push(asignaturaActualizada.alumnos[i].email); //push añade el email al array
        }
    }
    console.log('alumnos emails de esta asignatura: ', emails.toString());
    let mensaje = `Ha habido un cambio en la asignatura ${asignaturaActualizada.nombre}`;
    let mailOptions = {
        from: 'app.p2.add@gmail.com',
        to: emails.join(','),  
        subject: 'Asignatura editada ' + asignaturaActualizada.nombre,
        text: mensaje
    };
    await transporter.sendMail(mailOptions)
    .then(result => console.log(result))
    .catch(error => console.log(error));


    res.redirect('/asignaturas')
    } else {
        res.redirect('/')
    }
})

//middleware de autenticacion
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/')
}


module.exports = router;