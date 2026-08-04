---
name: typescript-advanced-types
description: Advanced TypeScript types (generics, conditionals, mapped, utilities). Use when building type-safe libraries or implementing complex type logic.
version: 1.0.0
---

# TypeScript Advanced Types

## Overview

Comprehensive guidance for mastering TypeScript's advanced type system including generics,
conditional types, mapped types, template literal types, and utility types.

## When to Use This Skill

- Building type-safe libraries or frameworks
- Creating reusable generic components
- Implementing complex type inference logic
- Designing type-safe API clients
- Implementing type-safe state management

## Core Concepts

### 1. Generics

```typescript
function identity<T>(value: T): T { return value; }

function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
```

### 2. Conditional Types

```typescript
type IsString<T> = T extends string ? true : false;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

### 3. Mapped Types

```typescript
type Readonly<T> = { readonly [P in keyof T]: T[P]; };
type Partial<T> = { [P in keyof T]?: T[P]; };
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
```

### 4. Template Literal Types

```typescript
type EventName = "click" | "focus" | "blur";
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"
```

## Best Practices

- Use `unknown` over `any` -- enforce type checking
- Prefer `interface` for object shapes
- Use `type` for unions and complex types
- Leverage type inference -- let TypeScript infer when possible
- Enable strict mode in tsconfig
- Never over-use `any` -- defeats TypeScript's purpose
