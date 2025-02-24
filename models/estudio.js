// Modulo mongoose para interactuar con MongoDB
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Definición del esquema de estudio
const estudioSchema = new Schema({
    tipo:  { type: String, required: true },   //Definimos el tipo en el schema (master o grado)
    nombre:  { type: String, required: true }  //Definimos la nombre del curso en el schema
});


// Método para insertar un nuevo estudio en la base de datos
estudioSchema.methods.insert = async function () {
    await this.save()
    .then(result => console.log(result))  // Guarda el estudio y muestra el resultado
    .catch(error => console.log(error));  //Se maneja el error
};
//Método para obtener un estudio por su id
estudioSchema.methods.findById = async function (id) {
    estudio = mongoose.model("estudio", estudioSchema); 
    return await estudio.findById(id)
    .then(result => { return result })  // Devuelve el estudio encontrado
    .catch(error => console.log(error));  //Se maneja el error
};

//Método para obtener todos los estudios
estudioSchema.methods.findAll = async function (id) {
    estudio = mongoose.model("estudio", estudioSchema); 
    return await estudio.find()
    .then(result => { return result })  // Devuelve el estudio encontrado
    .catch(error => console.log(error));  //Se maneja el error
};

//Método para actualizar un estudio por su id
estudioSchema.methods.update = async (id, estudio) => {
    estudio = mongoose.model("estudio", estudioSchema); 
    await estudio.updateOne({_id: id}, estudio) //actualiza el estudio
    .then(result => console.log(result))  // Muestra el resultado
    .catch(error => console.log(error));  //Se maneja el error
};

//Método para eliminar un estudio por su id
estudioSchema.methods.delete = async function (id) {
    estudio = mongoose.model("estudio", estudioSchema); 
    await estudio.deleteOne({_id: id}) //Elimina el estudio
    .then(result => console.log(result))  // Muestra el resultado
    .catch(error => console.log(error));  //Se maneja el error
};



// Exportar el modelo de estudio
module.exports = mongoose.model('estudio',estudioSchema);