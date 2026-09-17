CREATE DATABASE recetas;
USE recetas;
CREATE TABLE platillos (
    id INT PRIMARY KEY NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL
);