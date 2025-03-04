const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignatura');
const Software = require('../models/software');
const nodemailer = require('nodemailer'); //nodemailer
const fs = require('fs'); //fileSystem
const csv = require('csv-parser'); //encargado de parsear
const fs = require('fs') //fileSystem
const path = require('path'); // Necesario para la comprobación del archivo en el get /software/:id
const { error } = require('console');
const e = require('express');
const Usuario = require('../models/usuario')
const result = [];

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


async function verificarAcceso(req, res, next) {
    try {
        const asignaturaId = req.params._id;  // ID de la asignatura desde la URL
        const usuarioId = req.user._id;       // ID del usuario autenticado

        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado.");
            return res.redirect('/'); // Redirigir si el usuario no existe
        }

        // Si el usuario es administrador, permitir acceso inmediato
        if (usuario.rol === 'Administrador') {
            return next();
        }

        // Buscar la asignatura con sus profesores y alumnos
        const asignatura = await Asignatura.findById(asignaturaId).populate('profesores alumnos');
        if (!asignatura) {
            console.error("Asignatura no encontrada.");
            return res.redirect('/'); // Redirigir si no existe la asignatura
        }

        // Verificar si el usuario está en la lista de profesores o alumnos
        const esProfesor = asignatura.profesores.some(profesor => profesor._id.equals(usuarioId));
        const esAlumno = asignatura.alumnos.some(alumno => alumno._id.equals(usuarioId));

        if (!esProfesor && !esAlumno) {
            console.error("Acceso denegado: El usuario no está asignado a esta asignatura.");
            return res.redirect('/'); // Redirigir si el usuario no tiene acceso
        }

        // Si el usuario está en alguna lista, permitir el acceso
        next();
    } catch (error) {
        console.error("Error en la validación de acceso:", error);
        return res.redirect('/'); // Redirigir en caso de error
    }
}


//Obtener software
// Ruta para obtener todos los softwares de una asignatura específica
router.get('/software/:id',verificarAcceso ,async (req, res) => {
    //Primero pillar la asignatura
    const asignaturaId = req.params.id;// Usamos req.params.id en lugar de req.asignatura
    const asignatura = await Asignatura.findById(asignaturaId); // Buscar en la BD
    //console.log("Esta es la asignatura que encuentra: "+asignatura.id+" "+asignatura.nombre) //Traza 1
    const software = new Software();
    const softwares = await software.findAllFromAsignatura(asignatura);

    // Verificar si el archivo realmente existe en la carpeta "files"
    softwares.forEach(software => {
        // Validar que software.archivo no sea undefined o vacío
        if (software.archivo && typeof software.archivo === 'string' && software.archivo.trim() !== '') {
            const filePath = path.join(__dirname, '../files', software.archivo);
            software.existe = fs.existsSync(filePath); // en jvScript los objetos son dinámicos, por eso le podemos agrgar la propiedad 'existe' sin estar definida en el modelo
        } else {
            software.existe = false; // Si no hay archivo, marcar como no existente
        }
    });

    //console.log("Este es el software de la asignatura: " + softwares); //Traza 2
    res.render('software', { softwares, asignatura }); // Pasamos 'asignaturas' al renderizado para consistencia
});

// Para añadir software 
router.post('/software/add', async (req, res) => {
    try { 
        //let asignatura = req.params.id; No se lo estamos pasando por ruta, sino por el body
        const { link, descripcion,asignaturaId,archivo} = req.body;

        // Crear nuevo software
        const newSoftware = new Software({
            link,
            descripcion,
            asignatura: asignaturaId, // Guardamos el ID de la asignatura, en el campo 'asignatura' de softwareSchema
            archivo 
        });

      
        //Guardar archivo en software
        if (req.files && req.files.archivo) { 
            let EDFile = req.files.archivo;

            //Vamos a darle un nombre único
            let nombreArchivo = `${Date.now()}_${EDFile.name}`;
              newSoftware.archivo = nombreArchivo;
              await  EDFile.mv(`./files/${nombreArchivo}`);
        }

        await newSoftware.insert(); // Guardar software

        //Cada vez que haya un cambio en una asignatura, los alumnos de la asignatura reciben una notificación 
        const asignatura = await Asignatura.findById(asignaturaId).populate('alumnos', 'email'); //buscar asignatura x email y con populate() obtenemos esos datos en vez de unicamente el ObjectId de cada uno

        //Obtener los emails de los alumnos en un array
        let emails = [];
        for (let i = 0; i < asignatura.alumnos.length; i++) {
            if (asignatura.alumnos[i].email) { 
                emails.push(asignatura.alumnos[i].email); //push añade el email al array
            }
        }
        console.log('alumnos emails de esta asignatura: ', emails.toString());

        let mensaje = `Se ha añadido un software en la asignatura ${asignatura.nombre}`;
        let mailOptions = {
            from: 'app.p2.add@gmail.com',
            to: emails.join(','),  
            subject: 'Asignatura editada ' + asignatura.nombre,
            text: mensaje
        };
        await transporter.sendMail(mailOptions)
        .then(result => console.log(result))
        .catch(error => console.log(error));

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
        
        if (software.archivo){
            let nombreArchivo= software.archivo;
            // Eliminar el archivo asociado al software
            const filePath = path.join(__dirname, '../files', nombreArchivo); // Ruta completa del archivo
            fs.unlink(filePath,error); //necesita una callback como segundo argumento por si hay un error
        }

            // Eliminar el software
            await Software.findByIdAndDelete(id);

        //Cada vez que haya un cambio en una asignatura, los alumnos de la asignatura reciben una notificación 
        const asignatura = await Asignatura.findById(asignaturaId).populate('alumnos', 'email'); //buscar asignatura x email y con populate() obtenemos esos datos en vez de unicamente el ObjectId de cada uno
        //Obtener los emails de los alumnos en un array
        let emails = [];
        for (let i = 0; i < asignatura.alumnos.length; i++) {
            if (asignatura.alumnos[i].email) { 
                emails.push(asignatura.alumnos[i].email); //push añade el email al array
            }
        }
        console.log('alumnos emails de esta asignatura: ', emails.toString());
        let mensaje = `Se ha eliminado un software en la asignatura ${asignatura.nombre}`;
        let mailOptions = {
            from: 'app.p2.add@gmail.com',
            to: emails.join(','),  
            subject: 'Asignatura editada ' + asignatura.nombre,
            text: mensaje
        };
        await transporter.sendMail(mailOptions)
        .then(result => console.log(result))
        .catch(error => console.log(error));

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
            let nombreArchivo = ""; //Lo definimos aquí, ya que luego lo pasamos en el updateOne y nos va a hacer falta aunque no se actualice
            console.log("Intentando editar software con id ", id);

            //Guardar archivo en software
            if (req.files && req.files.archivo) { 
                let EDFile = req.files.archivo;

                //Vamos a darle un nombre único
                nombreArchivo = `${Date.now()}_${EDFile.name}`;
                software.archivo = nombreArchivo;
                await  EDFile.mv(`./files/${nombreArchivo}`);

                    // Actualizar el software con los datos proporcionados en req.body
                await Software.updateOne(
                { _id: id },
                {
                    ...req.body, //Con los tres puntitos podemos modificar elementos de ese req.body, en este caso el campo 'archivo'
                    archivo: nombreArchivo //Le agregamos manualmente
                });
            }else{
                await Software.updateOne({_id:id},{...req.body}); 
            }

        //Cada vez que haya un cambio en una asignatura, los alumnos de la asignatura reciben una notificación 
        const asignatura = await Asignatura.findById(asignaturaId).populate('alumnos', 'email'); //buscar asignatura x email y con populate() obtenemos esos datos en vez de unicamente el ObjectId de cada uno
        //Obtener los emails de los alumnos en un array
        let emails = [];
        for (let i = 0; i < asignatura.alumnos.length; i++) {
            if (asignatura.alumnos[i].email) { 
                emails.push(asignatura.alumnos[i].email); //push añade el email al array
            }
        }
        console.log('alumnos emails de esta asignatura: ', emails.toString());
        let mensaje = `Se ha editado un software en la asignatura ${asignatura.nombre}`;
        let mailOptions = {
            from: 'app.p2.add@gmail.com',
            to: emails.join(','),  
            subject: 'Asignatura editada ' + asignatura.nombre,
            text: mensaje
        };
        await transporter.sendMail(mailOptions)
        .then(result => console.log(result))
        .catch(error => console.log(error));

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