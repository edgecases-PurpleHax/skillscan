---
name: playwright-pom
description: 'Playwright test coding standards for this project. MUST be loaded before generating, healing, or writing any test code. Enforces: JavaScript only (no TypeScript), Page Object Model (POM) structure, locator encapsulation in page classes, spec file conventions, and Playwright best practices. Use when: creating spec files, fixing failing tests, refactoring test code.'
---

# Playwright Test Standards — JavaScript + Page Object Model

## Language: JavaScript Only

- ALL output files MUST use **`.js`** extension — NEVER `.ts`
- NEVER add TypeScript syntax: no type annotations, no interfaces, no `as Type` casts
- Use ES module syntax: `import { test, expect } from '@playwright/test';`
- No JSDoc type comments

## File Structure

```
tests/
  pages/                  ← Page Object classes (one per page)
    LoginPage.js
    DashboardPage.js
    PasswordResetPage.js
    RegisterPage.js
  login/                  ← Spec files (one per scenario)
    successful-login.spec.js
    form-validation.spec.js
```

## Page Object Model Rules

### What goes in a Page Object

- **All locators** — defined as constructor properties using role-based selectors
- **All actions** — methods that interact with the page (fill, click, navigate)
- **No assertions** — assertions belong exclusively in spec files

### What goes in a Spec File

- `import` of the Page Object class
- `test.describe` / `test` blocks
- Instantiation: `const loginPage = new LoginPage(page);`
- `await` calls to Page Object action methods
- `await expect(...)` assertions

### Page Object Template

```js
export class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.emailField = page.getByRole('textbox', { name: 'email@example.com' });
    this.passwordField = page.getByRole('textbox', {
      name: 'enter your passsword',
    });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
    this.registerHereText = page.getByText("Don't have an account?");
    this.emailRequiredError = page.getByText('*Email is required');
    this.passwordRequiredError = page.getByText('*Password is required');
    this.emailValidError = page.getByText('*Enter Valid Email');
  }

  async goto() {
    await this.page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  }

  async login(email, password) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickRegisterHere() {
    await this.registerHereText.click();
  }

  async submitEmptyForm() {
    await this.loginButton.click();
  }
}
```

### Spec File Template

```js
// spec: specs/<feature>.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test.describe('Suite Name', () => {
  test('should do something', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // actions via page object
    await loginPage.login('user@example.com', 'Password123');

    // assertions in spec
    await expect(page).toHaveURL(/#\/dashboard\/dash/);
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });
});
```

## Locator Preference Order

1. `page.getByRole(role, { name })` — preferred for interactive elements
2. `page.getByLabel(label)` — preferred for form fields with visible labels
3. `page.getByText(text)` — for non-interactive text content
4. `page.locator('.css-class')` — last resort; only when ARIA-based options are unavailable

## Playwright Best Practices

- Use `await expect(element).toBeVisible()` — never manual truthy/falsy checks
- Use `await expect(page).toHaveURL(/regex/)` — regex patterns are more resilient than exact strings
- Use `await expect(element).toHaveValue(value)` to assert field contents
- Use `await expect(element).not.toBeVisible()` for negative assertions
- NEVER use `page.waitForTimeout()`
- NEVER use `page.waitForLoadState()`
- NEVER use `page.waitForNavigation()`
- NEVER use `page.evaluate()` when a Playwright API exists

## Page Objects for This Project

| Page           | File                               | URL fragment          |
| -------------- | ---------------------------------- | --------------------- |
| Login          | `tests/pages/LoginPage.js`         | `#/auth/login`        |
| Dashboard      | `tests/pages/DashboardPage.js`     | `#/dashboard/dash`    |
| Password Reset | `tests/pages/PasswordResetPage.js` | `#/auth/password-new` |
| Register       | `tests/pages/RegisterPage.js`      | `#/auth/register`     |

## When Healing Failing Tests

- Maintain POM structure — never move locators inline into spec files as a quick fix
- Update selectors **inside the Page Object class**, not inside the spec
- If a Page Object does not yet exist for the page being tested, create it first
- Keep all fixes in `.js` files — never convert to `.ts`
