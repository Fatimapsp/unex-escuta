const mongoose = require("mongoose");

const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Conexão com o banco feita com sucesso!")

    } catch (error) {
        console.error("Erro ao conectar com o banco: ", error.message)
    }

};

module.exports = connectDB;