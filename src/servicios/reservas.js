const Reserva = require("../modelos/reserva");
const { ErrorEntrada, NoEncontrado } = require("../errores");

// El servicio solo habla con el modelo: no conoce req ni res.
// Todas las operaciones son asincronas (devuelven promesas).

const ID_VALIDO = /^[0-9a-fA-F]{24}$/;

// Representacion publica: id textual derivado del ObjectId + campos del recurso.
// Las vistas usan estos mismos nombres (reserva.id, reserva.sala, ...).
function aRepresentacion(doc) {
  return {
    id: String(doc._id),
    estudiante: doc.estudiante,
    email: doc.email,
    sala: doc.sala,
    fecha: doc.fecha,
    turno: doc.turno,
    personas: doc.personas,
    estado: doc.estado,
  };
}

const ORDENES = {
  estudiante: { estudiante: 1, _id: 1 },
  "personas-asc": { personas: 1, _id: 1 },
  "personas-desc": { personas: -1, _id: 1 },
};

const CAMPOS_PUBLICOS = "estudiante email sala fecha turno personas estado";

function crearServicioReservas(modelo = Reserva) {
  return {
    async consultar({
      sala,
      orden = "estudiante",
      pagina = 1,
      limite = 2,
    } = {}) {
      const filtro = {};
      if (sala !== undefined) {
        filtro.sala = sala.trim();
      }
      const salto = (pagina - 1) * limite;
      const total = await modelo.countDocuments(filtro);
      const documentos = await modelo
        .find(filtro)
        .select(CAMPOS_PUBLICOS)
        .sort(ORDENES[orden])
        .skip(salto)
        .limit(limite)
        .lean();
      return {
        datos: documentos.map(aRepresentacion),
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite),
      };
    },

    // filtros.sala (opcional): solo un texto; el criterio se arma de forma explicita.
    async listar(filtros = {}) {
      const criterio = {};
      if (filtros.sala !== undefined) {
        if (typeof filtros.sala !== "string") {
          throw new ErrorEntrada("El filtro sala debe ser un único texto");
        }
        criterio.sala = filtros.sala;
      }
      const documentos = await modelo.find(criterio).lean();
      return documentos.map(aRepresentacion);
    },

    async buscarPorId(id) {
      if (typeof id !== "string" || !ID_VALIDO.test(id)) {
        throw new ErrorEntrada("ID mal formado");
      }
      const documento = await modelo.findById(id).lean();
      if (!documento) {
        throw new NoEncontrado("Reserva no encontrada");
      }
      return aRepresentacion(documento);
    },

    async contar() {
      return modelo.countDocuments({});
    },

    async crear(datos) {
      const reserva = new modelo(datos);
      try {
        await reserva.save();
      } catch (error) {
        if (error.name === "ValidationError") {
          const detalles = Object.values(error.errors).map((e) => e.message);
          throw new ErrorEntrada("Datos de reserva inválidos", detalles);
        }
        throw error;
      }
      return aRepresentacion(reserva);
    },

    async actualizar(id, datos) {
      if (typeof id !== "string" || !ID_VALIDO.test(id)) {
        throw new ErrorEntrada("ID mal formado");
      }
      const existente = await modelo.findById(id);
      if (!existente) {
        throw new NoEncontrado("Reserva no encontrada");
      }
      // Actualizamos solo los campos permitidos
      Object.assign(existente, datos);
      try {
        await existente.save();
      } catch (error) {
        if (error.name === "ValidationError") {
          const detalles = Object.values(error.errors).map((e) => e.message);
          throw new ErrorEntrada("Datos de reserva inválidos", detalles);
        }
        throw error;
      }
      return aRepresentacion(existente);
    },

    async eliminar(id) {
      if (typeof id !== "string" || !ID_VALIDO.test(id)) {
        throw new ErrorEntrada("ID mal formado");
      }
      const resultado = await modelo.findByIdAndDelete(id);
      if (!resultado) {
        throw new NoEncontrado("Reserva no encontrada");
      }
      return aRepresentacion(resultado);
    },
  };
}

module.exports = { crearServicioReservas, aRepresentacion };
