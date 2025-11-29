#!/bin/bash

###############################################################################
#                     Rewearify Test Suite Runner v1.0                        #
###############################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ${BOLD}🧪 Rewearify Test Suite Runner v1.0${NC}${BLUE}           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize status
AI_STATUS=0
BACKEND_STATUS=0
FRONTEND_STATUS=0

###############################################################################
# AI SERVICE TESTS
###############################################################################

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}${BOLD}🤖 Running AI Service Tests...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "ai_service" ]; then
  cd ai_service || exit
  
  if [ -f "requirements.txt" ]; then
    python -m pytest tests/ -v
    AI_STATUS=$?
    
    if [ $AI_STATUS -eq 0 ]; then
      echo -e "${GREEN}✅ AI Service tests completed successfully!${NC}"
    else
      echo -e "${RED}❌ AI Service tests failed!${NC}"
    fi
  else
    echo -e "${RED}⚠️  requirements.txt not found${NC}"
    AI_STATUS=1
  fi
  cd ..
else
  echo -e "${RED}❌ AI service directory not found${NC}"
  AI_STATUS=1
fi

###############################################################################
# BACKEND API TESTS
###############################################################################

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}${BOLD}🔧 Running Backend API Tests...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "backend" ]; then
  cd backend || exit
  npm test -- --passWithNoTests
  BACKEND_STATUS=$?
  
  if [ $BACKEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests completed successfully!${NC}"
  else
    echo -e "${RED}❌ Backend tests failed!${NC}"
  fi
  cd ..
else
  echo -e "${RED}❌ Backend directory not found${NC}"
  BACKEND_STATUS=1
fi

###############################################################################
# FRONTEND UI TESTS
###############################################################################

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}${BOLD}🎨 Running Frontend UI Tests...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "frontend" ]; then
  cd frontend || exit
  npm test -- --watchAll=false --passWithNoTests
  FRONTEND_STATUS=$?
  
  if [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend tests completed successfully!${NC}"
  else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
  fi
  cd ..
else
  echo -e "${RED}❌ Frontend directory not found${NC}"
  FRONTEND_STATUS=1
fi

###############################################################################
# SUMMARY
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ${BOLD}📊 TEST SUMMARY 📊${NC}${BLUE}                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $AI_STATUS -eq 0 ]; then
  echo -e "AI Service:  ${GREEN}${BOLD}✅ PASSED${NC}"
else
  echo -e "AI Service:  ${RED}${BOLD}❌ FAILED${NC}"
fi

if [ $BACKEND_STATUS -eq 0 ]; then
  echo -e "Backend:     ${GREEN}${BOLD}✅ PASSED${NC}"
else
  echo -e "Backend:     ${RED}${BOLD}❌ FAILED${NC}"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
  echo -e "Frontend:    ${GREEN}${BOLD}✅ PASSED${NC}"
else
  echo -e "Frontend:    ${RED}${BOLD}❌ FAILED${NC}"
fi

echo ""

# Overall status
if [ $AI_STATUS -eq 0 ] && [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         ${BOLD}✨ All tests passed successfully! ✨${NC}${GREEN}           ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║   ${BOLD}⚠️  Some tests failed. Review above. ⚠️${NC}${RED}        ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
