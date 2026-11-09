# TP 10 - Consultas de reservas de salas

Express 5 + Mongoose + MongoDB Atlas. Base `reservas_salas_u10`, colección `reservas`.

## Instalación

```
npm ci
copy .env.example .env
npm run check
node --env-file=.env scripts/comprobar-conexion.js
node --env-file=.env src/index.js
```

Variables (completar en `.env`, que no se sube al repositorio):

| Variable | Ejemplo |
| --- | --- |
| PORT | 3000 |
| MONGODB_URI | mongodb+srv://USUARIO:CLAVE@CLUSTER.mongodb.net/reservas_salas_u10 |

## Contrato de GET /api/reservas

Parámetros aceptados (cualquier otro devuelve 400, y ninguno puede repetirse):

| Parámetro | Valores | Predeterminado |
| --- | --- | --- |
| sala | texto no vacío, igualdad exacta luego de trim | sin filtro |
| orden | estudiante, personas-asc, personas-desc (desempate por _id) | estudiante |
| pagina | entero de 1 a 1000 | 1 |
| limite | entero de 1 a 20 | 2 |

Respuesta 200:

```json
{
  "datos": [],
  "pagina": 1,
  "limite": 2,
  "total": 0,
  "paginas": 0
}
```

Cada reserva de `datos` tiene `id`, `estudiante`, `email`, `sala`, `fecha`, `turno`, `personas` y `estado`. Una página fuera de resultados devuelve 200 con `datos` vacío. `GET /api/reservas/:id`, las vistas HTML y `/estado` no cambiaron.

## Solicitudes de Postman

La colección `postman/TP 10 - Reservas.postman_collection.json` tiene los seis POST de carga y los casos de consulta. Resultados esperados con las seis reservas iniciales:

| Caso | Resultado |
| --- | --- |
| sala=Sala Norte, orden=personas-asc, pagina=1, limite=2 | 200, 2 reservas, total 4, paginas 2 |
| mismo pedido con pagina=2 | 200, otras 2 reservas, total 4, paginas 2 |
| sin Params | 200, 2 reservas, total 6, paginas 3 |
| Sala Norte, pagina=3 | 200, datos vacío, total 4, paginas 2 |
| Sala inexistente | 200, datos vacío, total 0, paginas 0 |
| pagina=0, pagina=1.5, limite=21 | 400 |
| pagina repetida, sala vacía, sala repetida | 400 |
| orden=otro, select=email | 400 |

Las capturas de las respuestas reales van en la carpeta `capturas/`.

## Decisión de diseño

Si incorporáramos información de las salas, los datos de una sala (nombre, capacidad, equipamiento, ubicación) describen a la sala y no cambian con cada reserva, mientras que estudiante, email, fecha, turno, personas y estado describen a una reserva puntual. Tendría sentido usar una referencia (guardar el id de la sala en la reserva) porque una misma sala se usa en muchas reservas y así sus datos se corrigen en un solo lugar. Los datos embebidos servirían si queremos conservar una copia fija de lo que valía la sala al reservar, a costa de repetir información en cada documento.
