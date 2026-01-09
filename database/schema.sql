-- Creación de la base de datos
DROP DATABASE IF EXISTS routecrafterdb;
CREATE DATABASE routecrafterdb;

-- USAR
USE routecrafterdb;

DROP TABLE IF EXISTS route_execution_points;
DROP TABLE IF EXISTS route_executions;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS countries;

-- Creación de tablas
CREATE TABLE countries (
	id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iso VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE states (
	id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    country_id INT REFERENCES countries(id)
		ON DELETE CASCADE
);

CREATE TABLE cities (
	id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    state_id INT REFERENCES states(id)
		ON DELETE CASCADE
);

CREATE TABLE routes (
	id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(200),
    version INT,
    updated_at VARCHAR(20),
    city_id INT REFERENCES cities(id)
		ON DELETE CASCADE,
    CONSTRAINT unique_name_city UNIQUE (name, city_id)
);

CREATE TABLE route_executions (
	id INT AUTO_INCREMENT PRIMARY KEY,
    route_id BINARY(16) REFERENCES routes(id)
		ON DELETE CASCADE,
    license_plate VARCHAR(16),
    init_time VARCHAR(16),
    end_time VARCHAR(16),
    INDEX idx_re_route (route_id)
);

CREATE TABLE route_execution_points (
	id INT AUTO_INCREMENT PRIMARY KEY,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    speed FLOAT,
    route_execution_id INT REFERENCES route_executions(id)
		ON DELETE CASCADE,
	INDEX idx_rep_exec (route_execution_id)
);

-- Populación de la base de datos
INSERT INTO countries(name, iso) VALUES
	('Colombia', 'CO'),
    ('Estados Unidos', 'US');
    
INSERT INTO states (name, country_id) VALUES
	('Cundinamarca', (SELECT id FROM countries WHERE iso = 'CO')),
    ('Tolima', (SELECT id FROM countries WHERE iso = 'CO')),
    ('Illinois', (SELECT id FROM countries WHERE iso = 'US'));

INSERT INTO cities (name, state_id) VALUES
	('Girardot', (SELECT id FROM states WHERE name = 'Cundinamarca')),
    ('Bogotá', (SELECT id FROM states WHERE name = 'Cundinamarca')),
    ('Flandes', (SELECT id FROM states WHERE name = 'Tolima')),
    ('Chicago', (SELECT id FROM states WHERE name = 'Illinois'));

INSERT INTO routes (name, description, city_id) VALUES
	('1', 'El Hospital', (SELECT id FROM cities WHERE name = 'Girardot')),
    ('2', 'La esperanza', (SELECT id FROM cities WHERE name = 'Girardot')),
    ('J14', 'Jeffery Jump', (SELECT id FROM cities WHERE name = 'Chicago'));
    