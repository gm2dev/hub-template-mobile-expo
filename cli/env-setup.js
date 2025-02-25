const { execShellCommand } = require('./utils.js');
const { consola } = require('consola');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question and get answer
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to ask for environment variable values
const promptForEnvVariables = async () => {
  consola.info('Please provide values for your environment variables:');
  
  const envVars = {};
  
  // API URL
  envVars.API_URL = await askQuestion('API_URL [https://api.example.com]: ');
  if (!envVars.API_URL) envVars.API_URL = 'https://api.example.com';
  
  // Numeric variable
  let varNumber = await askQuestion('VAR_NUMBER [42]: ');
  envVars.VAR_NUMBER = varNumber || '42';
  
  // Boolean variable
  let varBool = await askQuestion('VAR_BOOL (true/false) [false]: ');
  if (!varBool || (varBool.toLowerCase() !== 'true' && varBool.toLowerCase() !== 'false')) {
    varBool = 'false';
  }
  envVars.VAR_BOOL = varBool.toLowerCase();
  
  // Ask if the user wants to add more custom environment variables
  const addMore = await askQuestion('Do you want to add more environment variables? (y/n) [n]: ');
  
  if (addMore.toLowerCase() === 'y') {
    let adding = true;
    while (adding) {
      const varName = await askQuestion('Variable name (e.g. STRIPE_KEY): ');
      if (!varName) continue;
      
      const varValue = await askQuestion(`Value for ${varName}: `);
      envVars[varName] = varValue;
      
      const another = await askQuestion('Add another variable? (y/n) [n]: ');
      if (another.toLowerCase() !== 'y') {
        adding = false;
      }
    }
  }
  
  return envVars;
};

// Function to prompt for app configuration values
const promptForAppConfig = async () => {
  consola.info('\nNow, let\'s configure your application:');
  
  const config = {};
  
  // App name
  config.NAME = await askQuestion('Application Name [MyApp]: ');
  if (!config.NAME) config.NAME = 'MyApp';
  
  // URL Scheme
  config.SCHEME = await askQuestion(`URL Scheme (lowercase, no spaces) [${config.NAME.toLowerCase().replace(/\s+/g, '')}]: `);
  if (!config.SCHEME) config.SCHEME = config.NAME.toLowerCase().replace(/\s+/g, '');
  
  // Bundle ID / Package
  config.BUNDLE_ID = await askQuestion('Bundle ID (iOS) [com.example.app]: ');
  if (!config.BUNDLE_ID) config.BUNDLE_ID = 'com.example.app';
  
  config.PACKAGE = await askQuestion(`Package name (Android) [${config.BUNDLE_ID}]: `);
  if (!config.PACKAGE) config.PACKAGE = config.BUNDLE_ID;
  
  return config;
};

// Function to update the env.js file with the provided environment variables
const updateEnvFile = (projectName, envVars, appConfig) => {
  const envPath = path.join(process.cwd(), `${projectName}/env.js`);
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace TODO comments and update app configuration
  if (appConfig) {
    // Replace NAME
    envContent = envContent.replace(
      /NAME = \s*['"][^'"]*['"]/m, 
      `NAME = '${appConfig.NAME}'`
    );
    
    // Replace SCHEME
    envContent = envContent.replace(
      /SCHEME = \s*['"][^'"]*['"]/m, 
      `SCHEME = '${appConfig.SCHEME}'`
    );
    
    // Replace BUNDLE_ID
    envContent = envContent.replace(
      /BUNDLE_ID = \s*['"][^'"]*['"]/m, 
      `BUNDLE_ID = '${appConfig.BUNDLE_ID}'`
    );
    
    // Replace PACKAGE
    envContent = envContent.replace(
      /PACKAGE = \s*['"][^'"]*['"]/m,
      `PACKAGE = '${appConfig.PACKAGE}'`
    );
  }
  
  // Find the environment configuration section
  const envConfigRegex = /\{(\s*APP_ENV[^}]*)\}/s;
  const match = envContent.match(envConfigRegex);
  
  if (!match) {
    consola.error('Could not find environment configuration in env.js');
    return false;
  }
  
  let configContent = match[1];
  
  // Add new environment variables
  let newConfigContent = configContent;
  
  // Check if there's a comment marker for adding env vars
  // if (newConfigContent.includes('// ADD YOUR ENV VARS HERE TOO')) {
  //   // Replace the comment with our new vars
  //   const commentRegex = /\/\/ ADD YOUR ENV VARS HERE TOO[^\n]*/;
  //   const envVarsString = Object.entries(envVars)
  //     .map(([key, value]) => {
  //       // Format the value based on its type
  //       const formattedValue = typeof value === 'string' && !value.startsWith('process.env') 
  //         ? `process.env.${key}`
  //         : value;
  //       return `${key}: ${formattedValue}`;
  //     })
  //     .join(',\n  ');
    
  //   newConfigContent = newConfigContent.replace(
  //     commentRegex, 
  //     `// Environment variables\n  ${envVarsString}`
  //   );
  // } else {
  //   // If there's no comment marker, add the vars before the closing brace
  //   const envVarsString = Object.entries(envVars)
  //     .map(([key, value]) => {
  //       const formattedValue = typeof value === 'string' && !value.startsWith('process.env') 
  //         ? `process.env.${key}`
  //         : value;
  //       return `  ${key}: ${formattedValue}`;
  //     })
  //     .join(',\n');
    
  //   newConfigContent = configContent + ',\n' + envVarsString;
  // }
  
  // Replace the original config with the new one
  envContent = envContent.replace(match[1], newConfigContent);
  
  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
  
  // Remove any remaining TODO comments for cleanliness
  envContent = fs.readFileSync(envPath, 'utf8');
  //envContent = envContent.replace(/\s*\/\/\s*TODO:.*$/gm, '');
  fs.writeFileSync(envPath, envContent);
  
  return true;
};

// Function to create .env files with the provided values
const createEnvFiles = (projectName, envVars) => {
  const envTypes = ['development', 'production', 'staging'];
  
  envTypes.forEach(type => {
    const envFilePath = path.join(process.cwd(), `${projectName}/.env.${type}`);
    
    let envFileContent = `# ${type.toUpperCase()} Environment Variables\n\n`;
    
    Object.entries(envVars).forEach(([key, value]) => {
      envFileContent += `${key}=${value}\n`;
    });
    
    fs.writeFileSync(envFilePath, envFileContent);
  });
  
  // Also create a .env file as default
  const defaultEnvPath = path.join(process.cwd(), `${projectName}/.env`);
  fs.copyFileSync(
    path.join(process.cwd(), `${projectName}/.env.development`), 
    defaultEnvPath
  );
};

// Main setup function to be exported
const setupEnvVariables = async (projectName) => {
  consola.start('Setting up application configuration');
  
  try {
    // First, prompt for app configuration values
    const appConfig = await promptForAppConfig();
    
    // Then prompt for environment variables
    // consola.start('Setting up environment variables');
    const envVars = {};//await promptForEnvVariables();
    
    // Close the readline interface
    rl.close();
    
    // Update the env.js file
    const updated = updateEnvFile(projectName, envVars, appConfig);
    
    if (updated) {
      // Create .env files
      //createEnvFiles(projectName, envVars);
      consola.success('Configuration set up successfully');
    } else {
      consola.warn('Failed to update environment configuration, but continuing setup');
    }
  } catch (error) {
    consola.error('Error setting up environment variables', error);
    consola.warn('Continuing with default environment setup');
    
    // Make sure to close the readline interface if there's an error
    if (rl.close) rl.close();
  }
};

module.exports = {
  setupEnvVariables,
};