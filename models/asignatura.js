//Librería Mongo y schema tipo Mongo
const mongoose = require('mongoose');
const software = require('./software');
const {Schema} = mongoose

//Schema de Asignatua
const asignaturaSchema = new Schema ({
    nombre: {type: String, required: true, unique:true},
    curso: {type: String, required: true},

    //alumnos y profesores son listas. Referencian a usuario y almacenan su _Id
    alumnos:
    [
        {type: mongoose.Schema.Types.ObjectId, ref:'usuario'}
    ],
    software:
    [
      {type: mongoose.Schema.Types.ObjectId, ref:'software'}
    ],
    archivo:{
      type: String
    },
    profesores:
    [
        {type: mongoose.Schema.Types.ObjectId, ref:'usuario'}
    ],
    estudio: {type: mongoose.Schema.Types.ObjectId, ref:'estudio'}
});

//NOTA: Comentar a Mario si también hay que añadir al esquema una lista de administradores

//Métodos de asignatura

//Encontrar todas las asignaturas de un usuario
asignaturaSchema.methods.findAllFromUsuario= async function (usuario) {
    const asignatura = mongoose.model("asignatura", asignaturaSchema);
    if (usuario.rol ==="Administrador"){
      return await asignatura.find()
      .then(result => {return result})
      .catch(error => console.log(error));
    }else{
      return await asignatura.find({ $or: [{ alumnos: usuario._id }, { profesores: usuario._id }]}) 
      .then(result => {return result})
      .catch(error => console.log(error));
    }
  };
  
  //Insertar asignatura
  asignaturaSchema.methods.insert= async function () {
    await this.save()
    .then(result => console.log(result))
    .catch(error => console.log(error));
  };
  
  //Actualizar asignatura
  asignaturaSchema.methods.update= async (id, asignatura) => {
    const Asig = mongoose.model("asignatura", asignaturaSchema);
    await Asig.updateOne({_id: id}, asignatura)
    .then(result => console.log(result))
    .catch(error => console.log(error));
  };

  //Borrar asignatura
  asignaturaSchema.methods.delete= async function (id) {
    const Asig = mongoose.model("asignatura", asignaturaSchema);
    await Asig.deleteOne({_id: id})
    .then(result => console.log(result))
    .catch(error => console.log(error));
  };
  
  //Encontrar asignatura por Id
  asignaturaSchema.methods.findById= async function (id) {
    const Asig = mongoose.model("asignatura", asignaturaSchema);
    return await Asig.findById(id)
    .then(result => {return result})
    .catch(error => console.log(error));
  };
  
  //Buscador de asignaturas: No sé si hace falta
  asignaturaSchema.methods.findSearch= async function (search, usuario) {
    const Asig = mongoose.model("asignatura", asignaturaSchema);
    return await this.find({
        nombre: new RegExp(search, 'i'), // Búsqueda insensible a mayúsculas
        $or: [{ alumnos: usuario }, { profesores: usuario}] // Buscar en alumnos o profesores
    })
    .then(result => {return result})
    .catch(error => console.log(error));
  };
  
  module.exports = mongoose.model('asignatura', asignaturaSchema);

    /*NOTAS:

        - new RegExp(entrada datos,'i')--> Sirve para crear expresiones regulares en Javascript
    */