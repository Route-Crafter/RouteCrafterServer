# RouteCrafter – Backend Server

Backend del sistema **RouteCrafter**, una plataforma colaborativa para la digitalización de rutas de buses a partir de los trayectos reales de los pasajeros.

El servidor actúa como soporte para la app móvil, permitiendo registrar y consultar recorridos asociados a una ruta específica.  
Actualmente, el sistema expone una **versión estable de la API**, enfocada en el registro y consulta de recorridos individuales.

---

## 🧠 Concepto general

RouteCrafter funciona bajo un modelo de **crowdsourcing**:

- Un pasajero se sube a un bus y registra un recorrido parcial de una ruta.
- El pasajero indica explícitamente a qué **ruta** pertenece ese recorrido.
- Distintos pasajeros pueden registrar trayectos diferentes de la misma ruta.
- El servidor almacena estos recorridos de forma independiente y persistente.

Estos recorridos constituyen la base para una futura etapa de procesamiento geoespacial que permitirá construir rutas completas a partir de múltiples trayectos parciales.

---

## 🏗️ Arquitectura

App Mobile (Android / iOS)
│
▼
REST API (Express.js)
│
▼
Base de datos (MySQL)

---

## 🛠️ Tecnologías

- **Node.js**
- **Express.js** – API REST
- **MySQL** – Base de datos relacional
- **mysql2** – Cliente MySQL para Node.js
- **dotenv** – Manejo de variables de entorno
- **UUID** – Identificadores únicos
- **Zod** – Validación de datos de entrada
- **Jest** – Tests unitarios

---

## 📂 Estructura del proyecto

routecrafter-server/
│
├── src/
| ├── config/ # Configuración de base de datos y entorno
| ├── controllers/ # Controladores de la API
│ ├── middlewares/ # Validaciones y middlewares
│ ├── models/ # Modelos de entidades de DB
│ ├── routes/ # Definición de endpoints
| ├── schemas/ # Esquemas de validación de requests
│ └── app.js # Configuración de Express
│
├── database/
│ └── schema.sql # Esquema de la base de datos
│
├── tests/ # Tests unitarios y tests API End-to-End (manual)
│
├── .github/workflows # Workflows de github (tests checks)
│
├── .env.example
├── package.json
└── README.md

---

## ⚙️ Configuración del entorno

1. Clonar el repositorio
2. Instalar dependencias:

   ```bash
   npm install

3. Crear la base de datos y ejecutar el esquema SQL

    En modo desarrollo, el servidor se conecta a una base de datos MySQL local según la configuración definida en server_sql_dev.js.

4. Elegir el modo de ejecución:
   1. Modo desarrollo
        Inicia el servidor usando la configuración local de MySQL:
            npm run dev
   2. Correr en producción
      1. Crear el archivo .env a partir de .env.example y configurar las variables de entorno.
      2. Iniciar el servidor:
        npm start

---

## 🧪 Correr tests

1. Tests unitarios

   ```bash
    npm run test

2. Tests API End-to-End (manual)

    Pasos:
    1. Correr el servidor: npm run dev
    2. Ejecutar los tests uno por uno en el archivo tests/api.http

---

## 🚧 Estado actual del proyecto

Funcionalidades disponibles:

✅ Creación y gestión de países, estados y ciudades

✅ Creación de rutas

✅ Registro de recorridos asociados a una ruta

✅ Consulta de recorridos por ruta

✅ Persistencia completa en base de datos

✅ API estable y funcional

Esta rama representa la versión estable actual del backend.

---

## Funcionalidades planificadas (roadmap)

Las siguientes funcionalidades forman parte del núcleo conceptual de RouteCrafter, pero no están implementadas aún en main:

- 🔜 Unificación de recorridos en una ruta completa

- 🔜 Geoaggregation de trayectorias GPS

- 🔜 Generación de geometría consolidada de rutas

- 🔜 Cálculo de tramos comunes y variaciones

Estas capacidades se desarrollan de forma incremental en ramas de feature y futuras versiones del proyecto.
