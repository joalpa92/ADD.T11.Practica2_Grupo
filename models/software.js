const mongoose = require('mongoose');
const { Schema } = mongoose;

// Definición del esquema de software
const SoftwareSchema = new Schema({
    link: { type: String, required: true }, // Definimos el campo 'link' como obligatorio en el esquema
    descripcion: { type: String, required: true }, // Definimos el campo 'descripcion' como obligatorio
    asignatura: { type: mongoose.Schema.Types.ObjectId, ref: 'asignatura' } // Relación con la colección 'asignatura'
});

// Método para insertar un nuevo documento en la colección 'software'
SoftwareSchema.methods.insert = async function () {
    await this.save()
        .then(result => console.log(result))  // Guarda el software y muestra el resultado
        .catch(error => console.log(error));  // Manejo de errores en caso de fallo
};

// Método para eliminar un documento por su ID
SoftwareSchema.methods.delete = async function (id) {
    const Software = mongoose.model("software", SoftwareSchema); // Se obtiene el modelo 'software'
    await Software.deleteOne({ _id: id }) // Se elimina el documento con el ID proporcionado
        .then(result => console.log(result)) // Muestra el resultado de la operación
        .catch(error => console.log(error)); // Manejo de errores en caso de fallo
};

// Método para actualizar un documento por su ID
SoftwareSchema.methods.update = async (id, software) => {
    const Software = mongoose.model("software", SoftwareSchema); // Se obtiene el modelo 'software'
    await Software.updateOne({ _id: id }, software) // Se actualiza el documento con el ID proporcionado
        .then(result => console.log(result)) // Muestra el resultado de la actualización
        .catch(error => console.log(error)); // Manejo de errores en caso de fallo
};

//Encontrar todas las asignaturas de un usuario
SoftwareSchema.methods.findAllFromAsignatura = async function (asignatura) {
    const Software = mongoose.model("software", SoftwareSchema); // Se obtiene el modelo 'software'

    return await Software.find({asignatura : asignatura})
        .then(result => { return result })
        .catch(error => console.log(error));
};

//Encontrar software por id
SoftwareSchema.methods.findById= async function(id){
    const Software = mongoose.model("software", SoftwareSchema);
    return await Software.findById(id)
    .then(result => {return result})
    .catch(error => console.log(error));
};



module.exports = mongoose.model('software', SoftwareSchema); // Exporta el modelo 'software'