---
name: react-state-management
description: Master modern React state management with Redux Toolkit, Zustand, Jotai, and React Query. Use when setting up global state, managing server state, or choosing between state management solutions.
---

# React State Management

## When to Use This Skill

- Setting up global state management in a React app
- Choosing between Redux Toolkit, Zustand, or Jotai
- Managing server state with React Query or SWR
- Implementing optimistic updates
- Migrating from legacy Redux to modern patterns

## Core Concepts

### 1. State Categories

| Type | Description | Solutions |
|------|-------------|-----------|
| **Local State** | Component-specific, UI state | useState, useReducer |
| **Global State** | Shared across components | Redux Toolkit, Zustand, Jotai |
| **Server State** | Remote data, caching | React Query, SWR, RTK Query |
| **URL State** | Route parameters, search | React Router, nuqs |
| **Form State** | Input values, validation | React Hook Form, Formik |

### 2. Selection Criteria

```
Small app, simple state -> Zustand or Jotai
Large app, complex state -> Redux Toolkit
Heavy server interaction -> React Query + light client state
Atomic/granular updates -> Jotai
```

## Quick Start (Zustand)

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useStore = create<AppState>()(
  devtools(persist(
    (set) => ({
      user: null,
      theme: 'light',
      setUser: (user) => set({ user }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
    }),
    { name: 'app-storage' }
  ))
)
```
