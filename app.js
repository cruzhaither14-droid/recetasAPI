/* definir los parametros de configuracion con el servidor */
const express = require('express');
const pool = require('./conexion.js');
const app = express();
app.use(express.json());

/* servir archivos estáticos (para la página del catálogo) */
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

/* URL base de la API, con la letra "s" para traer un lote manejable de platillos */
const URL_API = 'https://www.themealdb.com/api/json/v1/1/search.php?f=s';

/* leer los datos de la API */
app.get('/platillos-api', async (req, res) => {
    try {
        const consulta = await fetch(URL_API);
        const datos = await consulta.json();
        res.json(datos.meals);
    } catch (error) {
        console.error('Error al obtener los platillos:', error);
        res.status(500).json({ error: 'Error al obtener los platillos' });
    }
});

/* leer los datos de la base de datos */
app.get('/platillos-base', async (req, res) => {
    try {
        const [datos] = await pool.query('SELECT * FROM platillos');
        res.json(datos);
    } catch (error) {
        console.error('Error al obtener los platillos:', error);
        res.status(500).json({ error: 'Error al obtener los platillos' });
    }
});

/* comparar platillos entre API y base de datos */
app.get('/comparar-platillos', async (req, res) => {
    try {
        const consulta = await fetch(URL_API);
        const datosApi = await consulta.json();
        const [datosBD] = await pool.query('SELECT * FROM platillos');

        const resultado = datosApi.meals.map(platilloAPI => {
            const idApi = Number(platilloAPI.idMeal);
            const platilloBD = datosBD.find(p => p.id === idApi);

            if (!platilloBD) {
                return {
                    id: idApi,
                    nombre: platilloAPI.strMeal,
                    estado: 'No existe en la base de datos'
                };
            }

            return {
                id: idApi,
                nombre: platilloAPI.strMeal,
                categoriaApi: platilloAPI.strCategory,
                categoriaBD: platilloBD.categoria,
                estado: platilloAPI.strCategory !== platilloBD.categoria
                    ? 'Las categorías son diferentes'
                    : 'Las categorías son iguales'
            };
        });

        res.json(resultado);

    } catch (error) {
        console.error('Error al comparar los platillos:', error);
        res.status(500).json({ error: 'Error al comparar los platillos' });
    }
});

/* actualizar únicamente los platillos cuya categoría sea diferente */
app.put('/actualizar-platillos', async (req, res) => {
    try {
        const consulta = await fetch(URL_API);
        const datosApi = await consulta.json();
        const [datosBD] = await pool.query('SELECT * FROM platillos');

        let actualizados = [];

        for (const platilloAPI of datosApi.meals) {
            const idApi = Number(platilloAPI.idMeal);
            const platilloBD = datosBD.find(p => p.id === idApi);

            const categoriaAPI = platilloAPI.strCategory || 'Sin categoría';

            if (platilloBD && categoriaAPI !== platilloBD.categoria) {
                await pool.query(
                    'UPDATE platillos SET categoria = ? WHERE id = ?',
                    [categoriaAPI, idApi]
                );
                actualizados.push({
                    id: idApi,
                    nombre: platilloAPI.strMeal,
                    categoriaAnterior: platilloBD.categoria,
                    categoriaNueva: platilloAPI.strCategory
                });
            }
        }

        res.json({
            mensaje: `${actualizados.length} platillo(s) actualizado(s)`,
            actualizados
        });
    } catch (error) {
        console.error('Error al actualizar los platillos:', error);
        res.status(500).json({ error: 'Error al actualizar los platillos' });
    }
});

/* agregar a la base de datos los platillos que faltan */
app.post('/agregar-platillos', async (req, res) => {
    try {
        const consulta = await fetch(URL_API);
        const datosApi = await consulta.json();
        const [datosBD] = await pool.query('SELECT * FROM platillos');

        let agregados = [];

        for (const platilloAPI of datosApi.meals) {
            const idApi = Number(platilloAPI.idMeal);
            const existe = datosBD.find(p => p.id === idApi);

            if (!existe) {
                await pool.query(
                    'INSERT INTO platillos (id, nombre, categoria, area) VALUES (?, ?, ?, ?)',
                    [
                        idApi,
                        platilloAPI.strMeal,
                        platilloAPI.strCategory || 'Sin categoría',
                        platilloAPI.strArea || 'Sin especificar'
                    ]
                );
                agregados.push({ id: idApi, nombre: platilloAPI.strMeal });
            }
        }

        res.json({
            mensaje: `${agregados.length} platillo(s) agregado(s)`,
            agregados
        });
    } catch (error) {
        console.error('Error al agregar los platillos:', error);
        res.status(500).json({ error: 'Error al agregar los platillos' });
    }
});

/* Iniciar el servidor (esta linea siempre va al final del archivo)*/
app.listen(3001, () => {
    console.log('Servidor corriendo en el puerto 3001');
});