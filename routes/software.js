
const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignatura');
const Software = require('../models/software');
const fs = require('fs') //fileSystem
const path = require('path'); // Necesario para la comprobación del archivo en el get /software/:id
const { error } = require('console');
const e = require('express');

//Obtener software
// Ruta para obtener todos los softwares de una asignatura específica
router.get('/software/:id', async (req, res) => {
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

// Para añadir software sin usar el signup
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

        // Redirigir a la vista de software de esa asignatura
        res.redirect('/software/' + asignaturaId);
    } catch (error) {
        console.error('Error al eliminar software:', error);
        res.status(500).send('Error en el servidor');
    }
});


//Ruta para mostrar el formulario de edicion de software
router.get('/software/edit/:id', async function (req, res, next) {
    var software = new Software();
    software = await software.findById(req.params.id);
    res.render('editSoftware', {software});
});

//Ruta para modificar datos del software. Redirige a /Software/idAsignatura
router.post('/software/edit/:id', async function (req, res, next) {
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

        // Redirigir a la vista de la asignatura correspondiente
        res.redirect('/software/' + asignaturaId);
    } catch (error) {
        console.error("Error al editar software: ", error);
        next(error);
    }
});

module.exports = router;
