---
name: testing-strategy
description: >
  Use this skill when designing test suites, writing unit/integration/E2E tests,
  setting up test configuration (Vitest, Playwright), or implementing test patterns
  for Clean Architecture layers. Covers: domain tests, use case mocking, DB integration
  tests, API tests, visual regression, test factories, and testing best practices.
---

# Testing Strategy

This skill provides guidance for implementing a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests.

## When to use this skill

- When setting up testing infrastructure
- When writing tests for new features
- When debugging failing tests
- When improving test coverage
- When designing testable code

## Testing Pyramid

```
          ┌─────────┐
         /  E2E     \       Few, slow, expensive
        /   Tests    \
       ┌─────────────┐
      /  Integration  \     Some, medium speed
     /     Tests       \
    ┌───────────────────┐
   /      Unit Tests     \   Many, fast, cheap
  └───────────────────────┘
```

## Unit Testing

### Domain Layer Tests

Test domain logic in isolation with no external dependencies:

```typescript
// domain/entities/Story.test.ts
describe('Story', () => {
  describe('create', () => {
    it('should create a valid story', () => {
      const story = Story.create({
        title: 'The Magic Garden',
        content: new StoryContent('Once upon a time...'),
        childProfile: new ChildProfileId('child-123'),
      });

      expect(story.title).toBe('The Magic Garden');
      expect(story.status).toBe(StoryStatus.Draft);
    });

    it('should reject empty title', () => {
      expect(() => Story.create({ title: '', /* ... */ }))
        .toThrow(DomainError);
    });
  });

  describe('complete', () => {
    it('should transition from InProgress to Completed', () => {
      const story = createStoryInProgress();
      story.complete();
      expect(story.status).toBe(StoryStatus.Completed);
    });

    it('should reject completion of non-in-progress story', () => {
      const story = createDraftStory();
      expect(() => story.complete()).toThrow(DomainError);
    });
  });
});
```

### Use Case Tests

Mock ports to test orchestration logic:

```typescript
// application/use-cases/GenerateStoryUseCase.test.ts
describe('GenerateStoryUseCase', () => {
  let useCase: GenerateStoryUseCase;
  let mockStoryRepository: MockStoryRepositoryPort;
  let mockAIService: MockAIServicePort;
  let mockTTS: MockTextToSpeechPort;

  beforeEach(() => {
    mockStoryRepository = createMockStoryRepository();
    mockAIService = createMockAIService();
    mockTTS = createMockTTS();
    
    useCase = new GenerateStoryUseCase(
      mockStoryRepository,
      mockAIService,
      mockTTS,
    );
  });

  it('should generate and save a story', async () => {
    mockAIService.generate.mockResolvedValue({
      content: 'Once upon a time...',
    });
    mockTTS.synthesize.mockResolvedValue(new AudioBuffer());

    const result = await useCase.execute({
      childId: 'child-123',
      theme: 'adventure',
    });

    expect(result.success).toBe(true);
    expect(mockStoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.any(String) })
    );
  });

  it('should return error when AI service fails', async () => {
    mockAIService.generate.mockRejectedValue(new Error('API error'));

    const result = await useCase.execute({
      childId: 'child-123',
      theme: 'adventure',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('GENERATION_FAILED');
  });
});
```

### Test Utilities

Create reusable test factories:

```typescript
// test-utils/factories.ts
export function createStoryProps(
  overrides: Partial<CreateStoryProps> = {}
): CreateStoryProps {
  return {
    title: 'Test Story',
    content: new StoryContent('Once upon a time...'),
    childProfile: new ChildProfileId('child-123'),
    ...overrides,
  };
}

export function createStoryInProgress(): Story {
  const story = Story.create(createStoryProps());
  story.startReading(); // Transition to InProgress
  return story;
}
```

## Integration Testing

### Database Integration Tests

```typescript
// infrastructure/persistence/SupabaseStoryRepository.integration.test.ts
describe('SupabaseStoryRepository', () => {
  let repository: SupabaseStoryRepository;
  let testClient: SupabaseClient;

  beforeAll(async () => {
    testClient = createTestSupabaseClient();
    repository = new SupabaseStoryRepository(testClient);
  });

  afterEach(async () => {
    // Clean up test data
    await testClient.from('stories').delete().neq('id', 'null');
  });

  it('should save and retrieve a story', async () => {
    const story = Story.create(createStoryProps());
    
    await repository.save(story);
    const retrieved = await repository.findById(story.id);
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe(story.title);
  });

  it('should find stories by child', async () => {
    const childId = new ChildProfileId('child-123');
    const story1 = Story.create(createStoryProps({ childProfile: childId }));
    const story2 = Story.create(createStoryProps({ childProfile: childId }));
    
    await repository.save(story1);
    await repository.save(story2);
    
    const stories = await repository.findByChild(childId);
    expect(stories).toHaveLength(2);
  });
});
```

### API Integration Tests

```typescript
// api/routes/stories.integration.test.ts
describe('Stories API', () => {
  let app: Express;

  beforeAll(async () => {
    app = createTestApp();
  });

  describe('POST /api/stories', () => {
    it('should create a story', async () => {
      const response = await request(app)
        .post('/api/stories')
        .send({
          childId: 'child-123',
          theme: 'adventure',
        })
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
      });
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/stories')
        .send({ childId: 'child-123' });

      expect(response.status).toBe(401);
    });
  });
});
```

## End-to-End Testing

### Browser Tests with Playwright

```typescript
// e2e/story-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Story Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('should generate a new story', async ({ page }) => {
    // Navigate to story creation
    await page.click('[data-testid="new-story-button"]');
    
    // Select theme
    await page.click('[data-testid="theme-adventure"]');
    
    // Start generation
    await page.click('[data-testid="generate-story-button"]');
    
    // Wait for generation
    await expect(page.locator('[data-testid="story-player"]'))
      .toBeVisible({ timeout: 30000 });
    
    // Verify audio controls appear
    await expect(page.locator('[data-testid="play-button"]'))
      .toBeVisible();
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.click('[data-testid="new-story-button"]');
    await page.click('[data-testid="generate-story-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Unable to generate story');
  });
});
```

### Visual Regression Tests

```typescript
// e2e/visual/components.spec.ts
test('Button variants', async ({ page }) => {
  await page.goto('/storybook/button');
  
  await expect(page).toHaveScreenshot('button-variants.png', {
    mask: [page.locator('[data-testid="timestamp"]')],
  });
});
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-utils/setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/*.integration.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test-utils/',
        '**/*.d.ts',
      ],
    },
  },
});
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **One assertion per test** - Makes failures easier to diagnose
3. **Arrange-Act-Assert pattern** - Clear test structure
4. **Descriptive test names** - Should read like documentation
5. **Avoid test interdependence** - Each test should be isolated
6. **Mock at boundaries** - Mock external services, not internal modules
7. **Keep tests fast** - Unit tests should run in milliseconds
8. **Test edge cases** - Empty inputs, nulls, boundaries
