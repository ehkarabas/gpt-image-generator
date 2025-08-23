import { test, expect } from "@playwright/test";
import { devices } from "@playwright/test";

test.describe("Enhanced Header System", () => {
  test.beforeEach(async ({ page }) => {
    // Environment validation (TDD anti-skip pattern)
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `❌ CRITICAL: Missing environment variables: ${missingVars.join(', ')}\n` +
        `🛠️ Fix: Create proper .env.local file with all required variables\n` +
        `🚫 E2E tests cannot proceed without complete environment configuration`
      );
    }

    await page.goto('/');
  });

  test.describe("Adaptive Layout Detection", () => {
    test("should detect simple layout (single conversation)", async ({ page }) => {
      // Wait for page load and initial state
      await page.waitForSelector('[data-testid="chat-interface-adaptive"]', { state: 'visible' });
      
      // Check adaptive layout attributes for simple state
      const layoutContainer = page.getByTestId('chat-interface-adaptive');
      await expect(layoutContainer).toHaveAttribute('data-sidebar-visible', 'false');
      await expect(layoutContainer).toHaveAttribute('data-dropdown-visible', 'false');
      
      // Header should show simple branding
      const header = page.getByTestId('adaptive-header');
      await expect(header).toBeVisible();
      
      const brandLogo = page.getByTestId('brand-logo');
      await expect(brandLogo).toBeVisible();
      
      const simpleTitle = page.getByTestId('simple-title');
      await expect(simpleTitle).toHaveText('ChatGPT');
    });

    test("should adapt to dropdown layout (2-4 conversations)", async ({ page }) => {
      // Create multiple conversations to trigger dropdown
      const newChatButton = page.getByTestId('header-new-chat-button');
      
      // Create 2nd conversation
      await newChatButton.click();
      await page.waitForTimeout(500); // Brief pause for state update
      
      // Create 3rd conversation  
      await newChatButton.click();
      await page.waitForTimeout(500);
      
      // Should now show dropdown layout
      const layoutContainer = page.getByTestId('chat-interface-adaptive');
      await expect(layoutContainer).toHaveAttribute('data-dropdown-visible', 'true');
      await expect(layoutContainer).toHaveAttribute('data-sidebar-visible', 'false');
      
      // Conversation dropdown should be visible
      const dropdown = page.getByTestId('conversation-dropdown');
      await expect(dropdown).toBeVisible();
    });

    test("should adapt to sidebar layout (5+ conversations)", async ({ page }) => {
      // Create 5 conversations to trigger sidebar
      const newChatButton = page.getByTestId('header-new-chat-button');
      
      for (let i = 0; i < 5; i++) {
        await newChatButton.click();
        await page.waitForTimeout(300);
      }
      
      // Should now show sidebar layout on desktop
      const layoutContainer = page.getByTestId('chat-interface-adaptive');
      await expect(layoutContainer).toHaveAttribute('data-sidebar-visible', 'true');
      
      // Desktop sidebar should be visible
      const desktopSidebar = page.getByTestId('desktop-sidebar');
      await expect(desktopSidebar).toBeVisible();
    });
  });

  test.describe("Header Actions", () => {
    test("should handle new conversation creation", async ({ page }) => {
      const newChatButton = page.getByTestId('header-new-chat-button');
      await expect(newChatButton).toBeVisible();
      await expect(newChatButton).toBeEnabled();
      
      // Test loading state
      await newChatButton.click();
      
      // Should show loading state briefly
      await expect(newChatButton).toHaveAttribute('data-loading', 'true');
      
      // Should return to normal state after creation
      await expect(newChatButton).toHaveAttribute('data-loading', 'false');
    });

    test("should show conversation dropdown when appropriate", async ({ page }) => {
      // Create conversations to trigger dropdown
      const newChatButton = page.getByTestId('header-new-chat-button');
      await newChatButton.click();
      await page.waitForTimeout(500);
      await newChatButton.click();
      await page.waitForTimeout(500);
      
      // Dropdown should be present
      const dropdownTrigger = page.getByTestId('conversation-dropdown-trigger');
      await expect(dropdownTrigger).toBeVisible();
      
      // Test dropdown interaction
      await dropdownTrigger.click();
      
      const dropdownContent = page.getByTestId('conversation-dropdown-content');
      await expect(dropdownContent).toBeVisible();
      
      // Should show conversation list
      const conversationItems = page.getByTestId('dropdown-conversation-item');
      await expect(conversationItems).toHaveCount(2);
    });
  });
});

test.describe("Enhanced Header - Mobile Experience", () => {
  test.use({ ...devices['iPhone 13 Pro'] });

  test.beforeEach(async ({ page }) => {
    // Mobile-specific environment validation
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `❌ MOBILE TEST FAILURE: Missing environment variables: ${missingVars.join(', ')}\n` +
        `📱 Mobile tests require complete environment setup\n` +
        `🚫 Cannot proceed without all required variables`
      );
    }

    await page.goto('/');
  });

  test("should show mobile header with hamburger menu", async ({ page }) => {
    const layoutContainer = page.getByTestId('chat-interface-adaptive');
    await expect(layoutContainer).toHaveAttribute('data-mobile', 'true');
    
    const header = page.getByTestId('adaptive-header');
    await expect(header).toBeVisible();
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    await expect(mobileMenuButton).toBeVisible();
    await expect(mobileMenuButton).toHaveAttribute('aria-label', 'Open menu');
  });

  test("should open mobile sidebar overlay", async ({ page }) => {
    // Create some conversations first
    const newChatButton = page.getByTestId('header-new-chat-button');
    await newChatButton.click();
    await page.waitForTimeout(500);
    
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    await mobileMenuButton.click();
    
    // Mobile sidebar overlay should appear
    const mobileSidebar = page.getByTestId('mobile-sidebar-overlay');
    await expect(mobileSidebar).toBeVisible();
    await expect(mobileSidebar).toHaveAttribute('data-state', 'open');
    
    // Should show backdrop
    const backdrop = page.getByTestId('mobile-sidebar-backdrop');
    await expect(backdrop).toBeVisible();
  });

  test("should close mobile sidebar with backdrop click", async ({ page }) => {
    // Open mobile sidebar first
    const newChatButton = page.getByTestId('header-new-chat-button');
    await newChatButton.click();
    await page.waitForTimeout(500);
    
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    await mobileMenuButton.click();
    
    const mobileSidebar = page.getByTestId('mobile-sidebar-overlay');
    await expect(mobileSidebar).toBeVisible();
    
    // Click backdrop to close
    const backdrop = page.getByTestId('mobile-sidebar-backdrop');
    await backdrop.click();
    
    // Should close
    await expect(mobileSidebar).toHaveAttribute('data-state', 'closed');
  });

  test("should close mobile sidebar with escape key", async ({ page }) => {
    // Open mobile sidebar
    const newChatButton = page.getByTestId('header-new-chat-button');
    await newChatButton.click();
    await page.waitForTimeout(500);
    
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    await mobileMenuButton.click();
    
    const mobileSidebar = page.getByTestId('mobile-sidebar-overlay');
    await expect(mobileSidebar).toBeVisible();
    
    // Press escape to close
    await page.keyboard.press('Escape');
    
    // Should close
    await expect(mobileSidebar).toHaveAttribute('data-state', 'closed');
  });

  test("should prevent body scroll when mobile sidebar is open", async ({ page }) => {
    // Open mobile sidebar
    const newChatButton = page.getByTestId('header-new-chat-button');
    await newChatButton.click();
    await page.waitForTimeout(500);
    
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    await mobileMenuButton.click();
    
    // Check that body has scroll-lock
    const body = page.locator('body');
    await expect(body).toHaveClass(/overflow-hidden/);
    
    // Close sidebar
    await page.keyboard.press('Escape');
    
    // Body scroll should be restored
    await expect(body).not.toHaveClass(/overflow-hidden/);
  });
});

test.describe("State-Aware Test Infrastructure", () => {
  test("should provide comprehensive test data attributes", async ({ page }) => {
    await page.goto('/');
    
    // Main layout container with state indicators
    const layoutContainer = page.getByTestId('chat-interface-adaptive');
    await expect(layoutContainer).toHaveAttribute('data-sidebar-visible');
    await expect(layoutContainer).toHaveAttribute('data-dropdown-visible'); 
    await expect(layoutContainer).toHaveAttribute('data-mobile');
    
    // Header with action states
    const header = page.getByTestId('adaptive-header');
    await expect(header).toBeVisible();
    
    const newChatButton = page.getByTestId('header-new-chat-button');
    await expect(newChatButton).toHaveAttribute('data-loading');
    await expect(newChatButton).toHaveAttribute('aria-label');
    
    // State-aware components should have proper test IDs
    const mainContent = page.getByTestId('chat-main-adaptive');
    await expect(mainContent).toBeVisible();
  });

  test("should handle interaction testing flows", async ({ page }) => {
    await page.goto('/');
    
    // Test complete interaction flow
    const newChatButton = page.getByTestId('header-new-chat-button');
    
    // Initial state
    await expect(newChatButton).toHaveAttribute('data-loading', 'false');
    
    // Click and verify loading state
    await newChatButton.click();
    await expect(newChatButton).toHaveAttribute('data-loading', 'true');
    
    // Wait for completion
    await expect(newChatButton).toHaveAttribute('data-loading', 'false');
    
    // Verify UI adaptation occurred
    const layoutContainer = page.getByTestId('chat-interface-adaptive');
    await expect(layoutContainer).toBeVisible();
  });
});