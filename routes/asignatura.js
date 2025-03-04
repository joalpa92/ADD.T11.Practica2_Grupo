const express = require('express');
const router = express.Router();
const Asignatura = require('../models/asignatura');
const Usuario = require('../models/usuario'); // Modelo de usuarios
const Estudio = require('../models/estudio'); // Modelo de estudios
<<<<<<< HEAD
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
=======
const nodemailer = require('nodemailer');
const fs = require('fs');
const csv = require('csv-parser');
const asignatura = require('../models/asignatura');
const results = [];



>>>>>>> RAMAMIGUEL

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

        //verificamos si se sube un archivo
        if (req.files && req.files.archivo){
            let EDFile = req.files.archivo;
            asignatura.archivo = EDFile.name;//fuardamos el nombre del archivo de la asignatura
            await EDFile.mv(`./files/${EDFile.name}`);//y la movemos a la carpeta files
        }
        
        await nuevaAsignatura.save();
        res.redirect('/asignaturas'); // Redirigir tras guardar
    } catch (error) {
        console.error('Error al guardar asignatura:', error);
        res.status(500).send('Error al guardar la asignatura');
    }
});

<<<<<<< HEAD
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
=======

//ruta para subir tareas desde CSV
router.post('/addAsignaturasCSV', isAuthenticated, async (req,res) => {
    try{
        if(!req.files || !req.files.archivo){//Verificamos si hay un archivo subido
            return res.status(400).send('No se ha podido subir el archivo');
        }

        const fileAsignatura = req.files.archivo;
        const filePath = `./files/asignaturas${fileAsignatura.name}`;

        await fileAsignatura.mv(filePath);//guarda el archivo en el server
        await readCSVFile(filePath, req.user._id);//procesa el archivo CSV para extraer las asignaturas
        res.redirect('/asignaturas');
    } catch(error){
        console.error('error al subir el archivo CSV:', error);
        res.status(500).send('Error al subir el archivo CSV');
    }
});

//Funcion para leer un archivo CSV y procesarlo
const readCSVFile = async (fileName, user) =>{
    try{
        const results= [];
        fs.createReadStream(fileName)//Esto lee el archivo CSV
        .pipe(csv({separator: ','}))//separamos los datos por comas
        .on('data', (data) => results.push(data))//fguardamos los datos en el arraylist results
        .on('end', async () =>{
            for(const AsignaturaData of results){//recorremos los datos del CSV
               const nuevaAsignatura = new Asignatura({
                nombre : AsignaturaData.nombre,
                curso : AsignaturaData.curso,
                estudio: AsignaturaData.estudio,
                usuario : user
               });
               await nuevaAsignatura.save();
            }
            console.log('CSV procesado Gucci');
        });
    }catch(error){
        console.error('Error al procesar el CSV:', error)
    }
};
//Ruta para eliminar un usuario por su id
router.get('/asignaturas/delete/:id', isAuthenticated, async (req, res, next) =>{
  const asignatura = new Asignatura();
  let {id} = req.params;
  console.log("Intentando eliminar asignatura con ID:", id); //Trazas para pruebas
  await asignatura.delete(id);
  res.redirect('/asignaturas');
>>>>>>> RAMAMIGUEL
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