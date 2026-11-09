const { ErrorEntrada } = require("../errores");

const PARAMETROS = ["sala", "orden", "pagina", "limite"];
const ORDENES = ["estudiante", "personas-asc", "personas-desc"];

function leerEntero(valor, nombre, predeterminado, minimo, maximo) {
  if (valor === undefined) {
    return predeterminado;
  }
  if (typeof valor !== "string") {
    throw new ErrorEntrada(`El parámetro ${nombre} debe enviarse una sola vez`);
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new ErrorEntrada(
      `El parámetro ${nombre} debe ser un entero entre ${minimo} y ${maximo}`,
    );
  }
  return numero;
}

function crearControladorApi(servicio) {
  return {
    async listarApi(req, res) {
      for (const nombre of Object.keys(req.query)) {
        if (!PARAMETROS.includes(nombre)) {
          throw new ErrorEntrada(`Parámetro desconocido: ${nombre}`);
        }
      }

      const consulta = {};

      if (req.query.sala !== undefined) {
        if (typeof req.query.sala !== "string") {
          throw new ErrorEntrada(
            "El parámetro sala debe enviarse una sola vez",
          );
        }
        if (req.query.sala.trim() === "") {
          throw new ErrorEntrada("El parámetro sala no puede estar vacío");
        }
        consulta.sala = req.query.sala.trim();
      }

      if (req.query.orden !== undefined) {
        if (typeof req.query.orden !== "string") {
          throw new ErrorEntrada(
            "El parámetro orden debe enviarse una sola vez",
          );
        }
        if (!ORDENES.includes(req.query.orden)) {
          throw new ErrorEntrada(
            `Orden no permitido. Opciones: ${ORDENES.join(", ")}`,
          );
        }
        consulta.orden = req.query.orden;
      }

      consulta.pagina = leerEntero(req.query.pagina, "pagina", 1, 1, 1000);
      consulta.limite = leerEntero(req.query.limite, "limite", 2, 1, 20);

      res.status(200).json(await servicio.consultar(consulta));
    },

    async obtener(req, res) {
      res.status(200).json(await servicio.buscarPorId(req.params.id));
    },

    async crear(req, res) {
      const reserva = await servicio.crear(req.reservaValidada);
      // 201 y Location se envian DESPUES de guardar.
      res.status(201).location(`/api/reservas/${reserva.id}`).json(reserva);
    },

    async actualizar(req, res) {
      const reserva = await servicio.actualizar(
        req.params.id,
        req.reservaValidada,
      );
      res.status(200).json(reserva);
    },

    async eliminar(req, res) {
      await servicio.eliminar(req.params.id);
      res.status(204).json({ mensaje: "Reserva eliminada" });
    },
  };
}

module.exports = { crearControladorApi };
