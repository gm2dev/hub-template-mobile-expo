#!/usr/bin/env node

const { consola } = require('consola');
const { showMoreDetails } = require('./utils.js');
const { cloneLastTemplateRelease } = require('./clone-repo.js');
const { setupProject, installDeps } = require('./setup-project.js');
const { setupEnvVariables } = require('./env-setup.js');

const createGM2DevApp = async () => {
  consola.box('GM2 Starter\nPerfect React Native App Kickstart 🚀!');
  // get project name from command line
  const projectName = process.argv[2];
  // check if project name is provided
  if (!projectName) {
    consola.error(
      'Please provide a name for your project: `npx create-gm2-expo-app@latest <project-name>`'
    );
    process.exit(1);
  }
  // clone the last release of the template from github
  await cloneLastTemplateRelease(projectName);

  // setup the project: remove unnecessary files, update package.json infos, name and set version to 0.0.1 + add initial version to osMetadata
  await setupProject(projectName);
  
  // Setup environment variables through interactive prompts
  await setupEnvVariables(projectName);

  // install project dependencies using detected package manager
  await installDeps(projectName);

  // show instructions to run the project + link to the documentation
  await showMoreDetails(projectName);
};

createGM2DevApp();