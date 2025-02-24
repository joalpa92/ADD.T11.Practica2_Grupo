const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const {Schema} = mongoose;

const usuarioSchema = new Schema({
    nombre: {type: String, required: false},
    email: {type: String, required: true},
    password: {type: String, required: true},
    apellido: {type: String, required: false},
    rol: {
        type: String, required: true
    }
    
});


//metodo para validar contraseña
usuarioSchema.methods.encryptPassword = async password => {
    return bcrypt.hashSync(password,bcrypt.genSaltSync (10));
};
//metodo para comparar contraseñas
usuarioSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password);
};
//metodo para volver a encriptar la contraseña
usuarioSchema.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}
//metodo para comparar contraseñas encriptadas
usuarioSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password);
};


/****ESTOS METODOS SON LOS QUE PUEDE HACER EL ADMINISTRADOR****/
//metodo para insertar un usuario
usuarioSchema.methods.insert = async function(){
   await this.save()
    .then(result => {return result})
    .catch(error => console.log(error));
};

//metodo para insertar una asignatura ESTE HAY Q LLAMAR AL DE LA CLASE ASIGNATURA
usuarioSchema.methods.insertAsignatura = async function(){
    await this.save()
    .then(result => console.log(result))
    .catch(error => console.log(error));
};

//metodo para eliminar un usuario
usuarioSchema.methods.delete = async function(id){
  const Usuario = mongoose.model("usuario", usuarioSchema);
    await Usuario.deleteOne({_id:id})
    .then(result => console.log(result))
    .catch(error => console.log(error));
};

//metodo para asignar un rol TODAVIA NO HACE NADA
usuarioSchema.methods.asignarRol = async function(){//Tengo que tocarlo mas tarde//
   await this.save()
    .then(result => console.log(result))
    .catch(error => console.log(error));
};

//metodo para modificar un usuario
usuarioSchema.methods.update = async function(id, usuario){
   const Usuario = mongoose.model("usuario", usuarioSchema);
    await Usuario.updateOne({_id:id}, usuario)
     .then(result => console.log(result))
     .catch(error => console.log(error));
};

//metodo para buscar por email
usuarioSchema.methods.findByEmail = async function(email){
    const Usuario = mongoose.model("usuario", usuarioSchema);
    return await Usuario.findOne({"email": email})
    .then(result => {return result})
    .catch(error => console.log(error));
}
    
//findbyid
usuarioSchema.methods.findById = async function(id){
    const Usuario = mongoose.model("usuario", usuarioSchema);
    return await Usuario.findById(id)
    .then(result => {return result})
    .catch(error => console.log(error));
}

//findall
usuarioSchema.methods.findAll = async function(){
    return await mongoose.model("usuario", usuarioSchema)
    .find({});
}







module.exports = mongoose.model('usuario', usuarioSchema);