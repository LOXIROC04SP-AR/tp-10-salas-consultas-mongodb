const test = require("node:test");
const assert = require("node:assert");
const { crearServicioReservas } = require("../src/servicios/reservas");
const { crearControladorApi } = require("../src/controladores/reservas-api");

const reservas = [
  ["Ana", "Sala Norte", 2],
  ["Bruno", "Sala Norte", 1],
  ["Carla", "Sala Norte", 2],
  ["Diego", "Sala Norte", 3],
  ["Elena", "Sala Sur", 1],
  ["Fabian", "Sala Multimedia", 4],
].map(([estudiante, sala, personas], i) => ({
  _id: `00000000000000000000000${i}`,
  estudiante,
  email: `${estudiante.toLowerCase()}@example.com`,
  sala,
  fecha: "2026-10-28",
  turno: "Mañana",
  personas,
  estado: "pendiente",
}));

function modeloFalso() {
  return {
    countDocuments: async (filtro) =>
      reservas.filter((r) => !filtro.sala || r.sala === filtro.sala).length,
    find(filtro) {
      let lista = reservas.filter(
        (r) => !filtro.sala || r.sala === filtro.sala,
      );
      const consulta = {
        select: () => consulta,
        sort(orden) {
          const [campo, sentido] = Object.entries(orden)[0];
          lista = [...lista].sort((a, b) =>
            a[campo] < b[campo]
              ? -sentido
              : a[campo] > b[campo]
                ? sentido
                : a._id < b._id
                  ? -1
                  : 1,
          );
          return consulta;
        },
        skip(n) {
          lista = lista.slice(n);
          return consulta;
        },
        limit(n) {
          lista = lista.slice(0, n);
          return consulta;
        },
        lean: async () => lista,
      };
      return consulta;
    },
  };
}

const servicio = crearServicioReservas(modeloFalso());
const controlador = crearControladorApi(servicio);

async function pedir(query) {
  let cuerpo;
  const res = {
    status() {
      return res;
    },
    json(valor) {
      cuerpo = valor;
    },
  };
  await controlador.listarApi({ query }, res);
  return cuerpo;
}

test("sin parametros devuelve pagina 1 con limite 2", async () => {
  const resultado = await pedir({});
  assert.strictEqual(resultado.datos.length, 2);
  assert.strictEqual(resultado.total, 6);
  assert.strictEqual(resultado.paginas, 3);
});

test("filtra por sala y ordena por personas-asc", async () => {
  const resultado = await pedir({
    sala: "Sala Norte",
    orden: "personas-asc",
    limite: "4",
  });
  assert.deepStrictEqual(
    resultado.datos.map((r) => r.personas),
    [1, 2, 2, 3],
  );
  assert.strictEqual(resultado.total, 4);
});

test("personas-desc invierte el orden", async () => {
  const resultado = await pedir({
    sala: "Sala Norte",
    orden: "personas-desc",
    limite: "4",
  });
  assert.deepStrictEqual(
    resultado.datos.map((r) => r.personas),
    [3, 2, 2, 1],
  );
});

test("pagina fuera de resultados devuelve datos vacio", async () => {
  const resultado = await pedir({ sala: "Sala Norte", pagina: "3" });
  assert.deepStrictEqual(resultado.datos, []);
  assert.strictEqual(resultado.total, 4);
  assert.strictEqual(resultado.paginas, 2);
});

test("sala inexistente devuelve total 0", async () => {
  const resultado = await pedir({ sala: "Sala inexistente" });
  assert.deepStrictEqual(resultado, {
    datos: [],
    pagina: 1,
    limite: 2,
    total: 0,
    paginas: 0,
  });
});

test("las reservas no exponen _id ni __v", async () => {
  const resultado = await pedir({});
  assert.deepStrictEqual(Object.keys(resultado.datos[0]).sort(), [
    "email",
    "estado",
    "estudiante",
    "fecha",
    "id",
    "personas",
    "sala",
    "turno",
  ]);
});

for (const [nombre, query] of [
  ["pagina=0", { pagina: "0" }],
  ["pagina=1.5", { pagina: "1.5" }],
  ["pagina=1001", { pagina: "1001" }],
  ["limite=21", { limite: "21" }],
  ["pagina repetida", { pagina: ["1", "2"] }],
  ["sala vacia", { sala: "  " }],
  ["sala repetida", { sala: ["Sala Norte", "Sala Sur"] }],
  ["orden desconocido", { orden: "otro" }],
  ["parametro select", { select: "email" }],
]) {
  test(`rechaza ${nombre}`, async () => {
    await assert.rejects(() => pedir(query), { name: "ErrorEntrada" });
  });
}
