# Rewearify Testing Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Test Stack](#test-stack)
- [Coverage Goals](#coverage-goals)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This document provides comprehensive information about testing strategies, infrastructure, and best practices for the Rewearify clothing donation platform. Our testing approach ensures reliability, maintainability, and high code quality across all components.

### Test Philosophy
- **Test-Driven Development (TDD)**: Write tests before or alongside new features
- **Comprehensive Coverage**: Aim for high coverage without sacrificing quality
- **Realistic Scenarios**: Tests should mirror real-world usage patterns
- **Maintainable Tests**: Keep tests simple, readable, and easy to update

---

## 🛠️ Test Stack

### AI Service (Python)
| Tool | Purpose | Version |
|------|---------|---------|
| **Pytest** | Test framework | ^7.0.0 |
| **pytest-cov** | Coverage reporting | ^4.0.0 |
| **pytest-asyncio** | Async test support | ^0.21.0 |
| **httpx** | HTTP client for API tests | ^0.24.0 |

### Backend (Node.js)
| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Test framework | ^29.7.0 |
| **Supertest** | HTTP assertion library | ^6.3.4 |
| **MongoDB Memory Server** | In-memory database | ^9.0.0 |

### Frontend (React)
| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Test framework | ^29.0.0 |
| **React Testing Library** | Component testing | ^14.0.0 |
| **jest-dom** | DOM matchers | ^6.1.5 |
| **user-event** | User interaction simulation | ^14.5.1 |

---

## 📊 Coverage Goals

### Target Coverage by Component

| Component | Target | Current | Status |
|-----------|--------|---------|--------|
| **AI Service** | 80% | TBD | 🟡 In Progress |
| **Backend** | 75% | TBD | 🟡 In Progress |
| **Frontend** | 70% | TBD | 🟡 In Progress |

### Coverage Metrics
- **Lines**: Percentage of code lines executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Statements**: Percentage of statements executed

---

## 🚀 Running Tests

### Quick Start - Run All Tests
