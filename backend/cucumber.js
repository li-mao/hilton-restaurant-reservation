module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    publishQuiet: true,
    paths: ['features/**/*.feature'],
    format: ['progress', 'summary'],
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'http://localhost:5000'
    }
  }
};
