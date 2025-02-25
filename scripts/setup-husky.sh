
# Navigate to the project root
cd "$(dirname "$0")/.."

# Remove existing husky directory if it exists
rm -rf .husky

# Create .husky directory
mkdir -p .husky

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
. "$(dirname -- "$0")/_/husky.sh"

. "$(dirname "$0")/common.sh"

echo "===\n>> Checking branch name..."

# Check if branch protection is enabled
if [[ -z $SKIP_BRANCH_PROTECTION ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    PROTECTED_BRANCHES="^(main|master)"

    if [[ $BRANCH =~ $PROTECTED_BRANCHES ]]; then
        echo ">> Direct commits to the $BRANCH branch are not allowed. Please choose a new branch name."
        exit 1
    fi
else
    echo ">> Skipping branch protection."
fi

echo ">> Finish checking branch name"
echo ">> Linting your files and fixing them if needed..."

bun lint-staged
EOF

# Make the hook executable
chmod +x .husky/pre-commit

# Create common.sh if it doesn't exist
if [ ! -f .husky/common.sh ]; then
  cat > .husky/common.sh << 'EOF'
command_exists () {
  command -v "$1" >/dev/null 2>&1
}

# Workaround for Windows 10, Git Bash and Yarn
if command_exists winpty && test -t 1; then
  exec < /dev/tty
fi
EOF
fi

echo "Husky setup complete!" 