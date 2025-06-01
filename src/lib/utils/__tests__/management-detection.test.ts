import {
  isInManagement,
  MANAGEMENT_KEYWORDS,
} from '../../../columnScripts/management-detection';

describe('isInManagement', () => {
  // Test basic functionality
  test('should return true for simple management titles', () => {
    expect(isInManagement('CEO')).toBe(true);
    expect(isInManagement('Founder')).toBe(true);
    expect(isInManagement('Managing Director')).toBe(true);
  });

  // Test titles with forward slashes
  test('should handle titles with forward slashes', () => {
    // expect(isInManagement('Founder/Head of Event Coordination')).toBe(true);
    // expect(isInManagement('CEO/CTO')).toBe(true);
    // expect(isInManagement('Director/Partner')).toBe(true);
    expect(
      isInManagement(
        'Founder/Head of Event Coordination and Public Relations at Whats The Point Cologne '
      )
    ).toBe(true);
  });

  // Test titles with special characters
  test('should handle titles with special characters', () => {
    expect(isInManagement('CEO & Founder')).toBe(true);
    expect(isInManagement('Managing Director - Operations')).toBe(true);
    expect(isInManagement('Head of Product (Technical)')).toBe(true);
  });

  // Test case sensitivity
  test('should be case insensitive', () => {
    expect(isInManagement('ceo')).toBe(true);
    expect(isInManagement('FOUNDER')).toBe(true);
    expect(isInManagement('Managing director')).toBe(true);
  });

  // Test non-management titles
  test('should return false for non-management titles', () => {
    expect(isInManagement('Software Engineer')).toBe(false);
    expect(isInManagement('Marketing Specialist')).toBe(false);
    expect(isInManagement('Sales Representative')).toBe(false);
  });

  // Test empty or invalid inputs
  test('should handle empty or invalid inputs', () => {
    expect(isInManagement('')).toBe(false);
    expect(isInManagement(null as any)).toBe(false);
    expect(isInManagement(undefined as any)).toBe(false);
  });

  // Test complex titles
  test('should handle complex titles with multiple roles', () => {
    expect(isInManagement('Founder/CEO/CTO at Tech Corp')).toBe(true);
    expect(isInManagement('Managing Director & Head of Strategy')).toBe(true);
    expect(isInManagement('Executive Director - Operations & Strategy')).toBe(
      true
    );
  });

  // Test multi-word keywords
  test('should handle multi-word keywords correctly', () => {
    expect(isInManagement('Associate Partner')).toBe(true);
    expect(isInManagement('Associate Partner/Head of Sales')).toBe(true);
    expect(isInManagement('Executive Director of Operations')).toBe(true);
    expect(isInManagement('Chief Technology Officer')).toBe(true);
    expect(isInManagement('Head of Product Development')).toBe(true);
  });

  // Test exact keyword matching
  test('should only match exact keywords', () => {
    // Should not match partial words
    expect(isInManagement('Associate')).toBe(false);
    expect(isInManagement('Partner')).toBe(true); // This should match as it's a single keyword
    expect(isInManagement('Executive Assistant')).toBe(false);
    expect(isInManagement('Chief Engineer')).toBe(false);

    // Should match complete keywords even with surrounding text
    expect(isInManagement('Senior Associate Partner at Company')).toBe(true);
    expect(isInManagement('Former Executive Director of Operations')).toBe(
      true
    );
    expect(isInManagement('Junior Head of Marketing')).toBe(false);

    // Should not match when words are split
    expect(isInManagement('Associate to Partner')).toBe(false);
    expect(isInManagement('Executive and Director')).toBe(false);
  });

  // Test all keywords
  test('should recognize all management keywords', () => {
    MANAGEMENT_KEYWORDS.forEach((keyword) => {
      expect(isInManagement(keyword)).toBe(true);
    });
  });
});
