module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'bun run type-check',
  ],
  '*.{json,md}': ['prettier --write'],
};
