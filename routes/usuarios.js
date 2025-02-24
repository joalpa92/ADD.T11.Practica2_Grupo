const router = require('express').Router();//importamos el modulo de express para definir las rutas
const passport = require('passport');//importamos el modulo de passport para la autenticacion
const Usuario = require('../models/usuario');//importamos el modelo de usuario
const fs = require('fs');
const csv = require('csv-parser');
const results = [];

//definimos la ruta de inicio
router.get('/', (req, res, next) => {
  res.render('index');
});

//ruta para la pagina de usuarios
router.get('/usuarios',isAuthenticated, async function(req, res, next) {
  const usuario = new Usuario();
  const usuarios = await usuario.findAll();
  res.render('usuarios', {usuarios});

});

//ruta para mostrar el (SIGNUP)
router.get('/signup', function(req, res, next) {
  res.render('signup');//renderizamos la pagina de signup
});

//ruta para procesar el formulario de (SIGNUP)
router.post('/signup', passport.authenticate('local-signup', {//utilizamos el pasport para autenticar el signup
  successRedirect: '/profile',//si es exitoso pa profile
  failureRedirect: '/signup',//sino pa signup
  failureFlash: true //Habilita mensajes flash para errores
}));


//ruta para mostrar el (SIGNIN)
router.get('/signin', function(req, res, next) {
  res.render('signin');//renderizamos la pagina de signin
});


//ruta para procesar el formulario de (SIGNIN)
router.post('/signin', passport.authenticate('local-signin', {//utilizamos el pasport para autenticar el signin
  successRedirect: '/profile',//si es exitoso pa profile
  failureRedirect: '/signin',//sino pa signin
  failureFlash: true //Habilita mensajes flash para errores
}));


//ruta para mostrar el perfil del admin
router.get('/profile', isAuthenticated, function(req, res, next) {
  res.render('profile');//renderizamos la pagina de profile
});

// Para añadir usuarios sin usar el signup
router.post('/usuario/add', async (req, res) => {
  const usuario= new Usuario();
  try {
    const { email, password, rol, nombre, apellido } = req.body;

    // Verificar si el email ya está registrado
    const existingUser = await Usuario.findOne({ email });

    if (existingUser) {
      req.flash('signupMessage', 'El correo ya está en uso.');
      return res.redirect('/usuario/add'); // O redirigir a una página de error
    }

    // Crear nuevo usuario
    const newUser = new Usuario({
      email,
      password: usuario.encryptPassword(password), // Asegúrate de que sea un método estático
      rol,
      nombre,
      apellido,
    });

    //verificamos si se sube un archivo
    if (req.files && req.files.archivo){
        let EDFile = req.files.archivo;
        usuario.archivo = EDFile.name;//fuardamos el nombre del archivo de la asignatura
        await EDFile.mv(`./files/${EDFile.name}`);//y la movemos a la carpeta files
    }

    // Guardar usuario
    await newUser.insert();

    console.log('Usuario agregado con éxito:', newUser);

    return res.redirect('/usuarios'); // Ruta corregida con '/'
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    return res.status(500).send('Error en el servidor');
  }
});

//ruta para subir tareas desde CSV
router.post('/addUsuariosCSV', isAuthenticated, async (req,res) => {
  try{
      if(!req.files || !req.files.archivo){//Verificamos si hay un archivo subido
          return res.status(400).send('No se ha podido subir el archivo');
      }

      const fileUsuario = req.files.archivo;
      const filePath = `./files/usuarios${fileUsuario.name}`;

      await fileUsuario.mv(filePath);//guarda el archivo en el server
      await readCSVFile(filePath, req.user._id);//procesa el archivo CSV para extraer las asignaturas
      res.redirect('/usuarios');
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
            for(const UsuarioData of results){//recorremos los datos del CSV
               const nuevoUsuario = new Usuario({
                nombre : UsuarioData.nombre,
                email: UsuarioData.email,
                password: UsuarioData.password,
                apellido: UsuarioData.apellido,
                rol : UsuarioData.rol,
                usuario : user
               });
               await nuevoUsuario.save();
            }
            console.log('CSV procesado Gucci');
        });
    }catch(error){
        console.error('Error al procesar el CSV:', error)
    }
};


//para obtener datos en la ventana editar usuarios por id
router.get('/usuarios/editUsuarios/:id', isAuthenticated, async function (req, res, next) {
  var usuario = new Usuario();
  usuario = await usuario.findById(req.params.id);
  res.render('editUsuarios', {usuario});
});

// Actualizar usuariocon los datos del formulario en ventana editUsuario 
router.post('/usuarios/editUsuarios/:id', isAuthenticated,async function(req, res, next) {
  const usuario = new Usuario();
  const {id} = req.params;
  await usuario.update({_id : id}, req.body);
  res.redirect('/usuarios');
});


//para eliminar usuarios por id
router.get('/usuarios/delete/:id', isAuthenticated, async function(req, res, next) {
  const usuario = new Usuario();
  let {id} = req.params;
  await usuario.delete(id);
  res.redirect('/usuarios');
});


//ruta para cerrar sesion
router.get('/logout', function(req, res, next) {
  req.logout(function(err){
    if (err) { return next(err); }
    res.redirect('/');
  });
});

//funcion para verificar si el usuario esta autenticado
function isAuthenticated(req, res, next){
  if(req.isAuthenticated()){//si esta autenticado
    return next();//continua con la siguiente funcion
  }
  res.redirect('/');//sino redirige a la pagina de inicio
}

module.exports = router;