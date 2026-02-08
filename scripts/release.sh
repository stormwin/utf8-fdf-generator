#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from package.json or argument
VERSION="${1:-$(node -p "require('./package.json').version")}"

# Ensure version starts with 'v'
if [[ ! "$VERSION" =~ ^v ]]; then
	VERSION="v$VERSION"
fi

echo -e "${YELLOW}Preparing release ${VERSION}${NC}"
echo ""

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
	echo -e "${RED}Error: Working directory is not clean.${NC}"
	echo "Please commit or stash your changes before releasing."
	exit 1
fi

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
	echo -e "${RED}Error: Tag ${VERSION} already exists.${NC}"
	exit 1
fi

# Run lint
echo -e "${YELLOW}Running lint...${NC}"
npm run lint
echo -e "${GREEN}Lint passed.${NC}"
echo ""

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm test
echo -e "${GREEN}Tests passed.${NC}"
echo ""

# Create annotated tag
echo -e "${YELLOW}Creating tag ${VERSION}...${NC}"
git tag -a "$VERSION" -m "Release $VERSION"
echo -e "${GREEN}Tag ${VERSION} created.${NC}"
echo ""

# Ask to push
echo -e "${YELLOW}Push tag to origin? [y/N]${NC}"
read -r PUSH_CONFIRM

if [[ "$PUSH_CONFIRM" =~ ^[Yy]$ ]]; then
	git push origin "$VERSION"
	echo -e "${GREEN}Tag ${VERSION} pushed to origin.${NC}"
else
	echo -e "${YELLOW}Tag created locally. Push manually with:${NC}"
	echo "  git push origin $VERSION"
fi

echo ""
echo -e "${GREEN}Release ${VERSION} complete!${NC}"
