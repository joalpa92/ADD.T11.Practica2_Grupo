
const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignatura');
const Software = require('../models/software');
const Usuario = require('../models/usuario')

async function verificarAcceso(req, res, next) {
    try {
        const asignaturaId = req.params._id;
        const usuarioId = req.user._id;

        // Obtener usuario para verificar su rol
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado.");
            return res.redirect('/'); // Redirigir si el usuario no existe
        }

        // Si el usuario es administrador, permitir el acceso automáticamente
        if (usuario.rol === 'Administrador') {
            return next();
        }

        // Buscar la asignatura y rellenar profesores y alumnos
        const asignatura = await Asignatura.findById(asignaturaId).populate('profesores alumnos');
        if (!asignatura) {
            console.error("Asignatura no encontrada.");
            return res.redirect('/'); // Redirigir si la asignatura no existe
        }

        // Verificar si el usuario es profesor o alumno de la asignatura
        const esProfesor = asignatura.profesores.some(profesor => profesor._id.equals(usuarioId));
        const esAlumno = asignatura.alumnos.some(alumno => alumno._id.equals(usuarioId));

        if (!esProfesor && !esAlumno) {
            console.error("Acceso denegado: El usuario no está asignado a esta asignatura.");
            return res.redirect('/'); // Redirigir si el usuario no es ni profesor ni alumno
        }

        // Permitir el acceso
        next();
    } catch (error) {
        console.error("Error en la validación de acceso:", error);
        return res.redirect('/'); // Si hay un error, redirigir
    }
}

//Obtener software
// Ruta para obtener todos los softwares de una asignatura específica
router.get('/software/:id',verificarAcceso ,async (req, res) => {
    //Primero pillar la asignatura
    const asignaturaId = req.params.id;
    const asignatura = await Asignatura.findById(asignaturaId); // Buscar en la BD
    console.log("Esta es la asignatura que encuentra: "+asignatura.id+" "+asignatura.nombre) //Traza 1
    const software = new Software();
    const softwares = await software.findAllFromAsignatura(asignatura); // Usamos req.params.id en lugar de req.asignatura
    console.log("Este es el software de la asignatura: " + softwares); //Traza 2
    res.render('software', { softwares, asignatura }); // Pasamos 'asignaturas' al renderizado para consistencia
});

// Para añadir software sin usar el signup
router.post('/software/add', async (req, res) => {
    try {
        //let asignatura = req.params.id;//No se lo estamos pasando por ruta, sino por el body
        const { link, descripcion,asignaturaId } = req.body;

        // Crear nuevo software
        const newSoftware = new Software({
            link,
            descripcion,
            asignatura: asignaturaId // Guardamos el ID de la asignatura, en el campo 'asignatura' de softwareSchema
        });

        // Guardar software
        await newSoftware.insert();

        console.log('Contenido agregado con éxito:', newSoftware);

        return res.redirect('/software/' + asignaturaId);
    } catch (error) {
        console.error('Error al agregar contenido:', error);
        return res.status(500).send('Error en el servidor');
    }
});

//Ruta para eliminar un software por su id
router.get('/software/delete/:id', async (req, res, next) => {
    if(req.user.rol==="Administrador" || req.user.rol==="Profesor"){//cotenido añadido condicional para evitar entradas indeseadas
        try {
            //Capturamos en una variable la id pasada por ruta
            let { id } = req.params;

            // Buscar el software en la BD  para obtener el ID de la asignatura
            const software = await Software.findById(id);
            if (!software) {
                return res.status(404).send('Software no encontrado');
            }

            let asignaturaId = software.asignatura; // Obtener el ID de la asignatura antes de eliminar

            // Eliminar el software
            await Software.findByIdAndDelete(id);

            // Redirigir a la vista de software de esa asignatura
            res.redirect('/software/' + asignaturaId);
        } catch (error) {
            console.error('Error al eliminar software:', error);
            res.status(500).send('Error en el servidor');
        }
    }else{
        res.redirect('/')
    }
});


//Ruta para mostrar el formulario de edicion de software
router.get('/software/edit/:id', async function (req, res, next) {
    if(req.user.rol==="Administrador" || req.user.rol==="Profesor"){//cotenido añadido condicional para evitar entradas indeseadas
        var software = new Software();
        software = await software.findById(req.params.id);
        res.render('editSoftware', {software});
    }else{
        res.redirect('/')
    }
});

//Ruta para modificar datos del software. Redirige a /Software/idAsignatura
router.post('/software/edit/:id', async function (req, res, next) {
    if(req.user.rol==="Administrador" || req.user.rol==="Profesor"){//cotenido añadido condicional para evitar entradas indeseadas
        const { id } = req.params;
        
        try {
            // Buscar el software por ID para obtener el asignaturaId antes de la actualización
            const software = await Software.findById(id);
            
            if (!software) {
                return res.status(404).send("Software no encontrado");
            }
            
            // Obtener el ID de la asignatura del software antes de la actualización
            const asignaturaId = software.asignatura;

            console.log("Intentando editar software con id ", id);

            // Actualizar el software con los datos proporcionados en req.body
            await Software.updateOne({ _id: id }, req.body);

            // Redirigir a la vista de la asignatura correspondiente
            res.redirect('/software/' + asignaturaId);
        } catch (error) {
            console.error("Error al editar software: ", error);
            next(error);
        }
    }else{
        res.redirect('/')
    }
});



module.exports = router;
