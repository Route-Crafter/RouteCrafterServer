# RouteCrafter – Backend Server

Backend del sistema **RouteCrafter**, una plataforma colaborativa para la digitalización de rutas de buses a partir de los trayectos reales de los pasajeros.

El servidor actúa como soporte para la app móvil, permitiendo registrar y consultar recorridos asociados a una ruta específica. La unificación de recorridos en una ruta completa se encuentra actualmente en fase de pruebas.

---

## 🧠 Concepto general

RouteCrafter funciona bajo un modelo de **crowdsourcing**:

- Un pasajero se sube a un bus y registra un recorrido parcial de una ruta.
- El pasajero indica explícitamente a qué **ruta** pertenece ese recorrido.
- Cada pasajero puede registrar distintos trayectos de la misma ruta (subidas y bajadas en puntos diferentes).
- El servidor almacena estos recorridos de forma independiente.

En una etapa posterior, estos recorridos podrán ser unificados para construir una ruta completa de inicio a fin.

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

---

## 📂 Estructura del proyecto

routecrafter-server/
│
├── src/
│ ├── adapters/ # Configuración de base de datos y entorno
│ ├── routes/ # Definición de endpoints
│ ├── controllers/ # Controladores de la API
│ ├── services/ # Lógica de negocio
│ ├── models/ # Acceso a datos (MySQL)
│ ├── middlewares/ # Validaciones y middlewares
│ └── app.js # Configuración de Express
│
├── database/
│ └── schema.sql # Esquema de la base de datos
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

3. Crear el archivo .env a partir de .env.example

4. Crear la base de datos y ejecutar el esquema SQL
5. Iniciar el servidor:
    npm run dev

---

## 🚧 Estado actual del proyecto

Funcionalidades disponibles:

- ✅ Creación de rutas

- ✅ Registro de recorridos asociados a una ruta

- ✅ Consulta de recorridos por ruta

- ✅ Persistencia en base de datos

---

## Funcionalidades en desarrollo / prueba

- 🧪 Unificación de recorridos en una ruta completa

- 🧪 Generación de geometría consolidada

Actualmente no es posible obtener una ruta unificada.
El sistema solo devuelve los recorridos individuales registrados por los usuarios.
