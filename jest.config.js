export default {
  testEnvironment: 'node',
  transform: {}, // Desactiva transformaciones CJS
  testPathIgnorePatterns: [ // Archivos que se ignoran al ejecutar el script de test
    '/node_modules/',
    'tests/adapters/geo_aggregation_adapter_real.test.js',
    'tests/services/geo_aggregation_real.test.js'
  ]
};