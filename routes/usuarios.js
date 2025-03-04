const router = require('express').Router();//importamos el modulo de express para definir las rutas
const passport = require('passport');//importamos el modulo de passport para la autenticacion
const Usuario = require('../models/usuario');//importamos el modelo de usuario
const nodemailer = require('nodemailer'); //nodemailer

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

//definimos la ruta de inicio
router.get('/', (req, res, next) => {
  res.render('index');
});

//ruta para la pagina de usuarios
router.get('/usuarios',isAuthenticated, async function(req, res, next) {
  if(req.user.rol==="Administrador"){//cotenido añadido condicional para evitar entradas indeseadas
    const usuario = new Usuario();
  const usuarios = await usuario.findAll();
  res.render('usuarios', {usuarios});
  }else{
    res.redirect('/')
  }
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

//ruta para mostrar sugerencias
router.get('/sugerencias', isAuthenticated, function(req, res, next) {
  res.render('sugerencias'); //renderizar vista sugerencias
});

//ruta post para formulario de sugerencias
router.post('/usuario/sugerencias', isAuthenticated, async function(req, res, next) {
  const { nombre, email, asunto, descripcion } = req.body;

  //obtener los emails de los administradores
  const administradores = await Usuario.find({ rol: 'Administrador' }).populate('email');
  let emails = [];
  for (let i = 0; i < administradores.length; i++) {
    if (administradores[i].email) {
      emails.push(administradores[i].email); //con push añadir el email al array
    }
  }
  console.log('emails de los administradores: ', emails.toString()); //para ver si lo coge bien 

  let mensaje = `Sugerencia de ${nombre} (${email}): ${descripcion}`;
  let mailOptions = {
    from: 'app.p2.add@gmail.com',
    to: emails.join(','),
    subject: 'Sugerencia: '+asunto,
    text: mensaje
  };
  await transporter.sendMail(mailOptions)
    .then(result => console.log(result))
    .catch(error => console.log(error));

  return res.redirect('/sugerencias');
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

    // Guardar usuario
    await newUser.insert();

    console.log('Usuario agregado con éxito:', newUser);

    return res.redirect('/usuarios'); // Ruta corregida con '/'
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    return res.status(500).send('Error en el servidor');
  }
});

//para obtener datos en la ventana editar usuarios por id
router.get('/usuarios/editUsuarios/:id', isAuthenticated, async function (req, res, next) {
  if(req.user.rol==="Administrador"){//cotenido añadido condicional para evitar entradas indeseadas
    var usuario = new Usuario();
    usuario = await usuario.findById(req.params.id);
    res.render('editUsuarios', {usuario});
  }else{
    res.redirect('/')
  }
});

// Actualizar usuariocon los datos del formulario en ventana editUsuario 
router.post('/usuarios/editUsuarios/:id', isAuthenticated,async function(req, res, next) {
  if(req.user.rol==="Administrador"){//cotenido añadido condicional para evitar entradas indeseadas
    const usuario = new Usuario();
    const {id} = req.params;
    await usuario.update({_id : id}, req.body);
    res.redirect('/usuarios');
  }else{
    res.redirect('/')
  }
});


//para eliminar usuarios por id
router.get('/usuarios/delete/:id', isAuthenticated, async function(req, res, next) {
  if(req.user.rol==="Administrador"){//cotenido añadido condicional para evitar entradas indeseadas
    const usuario = new Usuario();
    let {id} = req.params;
    await usuario.delete(id);
    res.redirect('/usuarios');
  }else{
    res.redirect('/')
  }
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