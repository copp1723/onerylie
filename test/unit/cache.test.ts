/**
 * Unit tests for the cache utility
 */
import { 
  initializeCache, 
  getFromCache, 
  setInCache, 
  deleteFromCache, 
  clearCache,
  getCacheStats 
} from '../../server/utils/cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    // Reset the cache before each test
    clearCache();
  });

  test('should store and retrieve values', () => {
    // Arrange
    const key = 'test-key';
    const value = { name: 'Test Value', id: 123 };
    
    // Act
    setInCache(key, value);
    const retrieved = getFromCache(key);
    
    // Assert
    expect(retrieved).toEqual(value);
  });

  test('should handle TTL expiration', () => {
    // Arrange
    const key = 'expiring-key';
    const value = 'will expire';
    
    // Act - set with a 10ms TTL
    setInCache(key, value, 10);
    
    // Assert - immediately available
    expect(getFromCache(key)).toEqual(value);
    
    // Wait until expired
    return new Promise(resolve => {
      setTimeout(() => {
        // Should be gone after expiration
        expect(getFromCache(key)).toBeUndefined();
        resolve(true);
      }, 20);
    });
  });

  test('should delete keys', () => {
    // Arrange
    const key = 'delete-me';
    const value = 'to be deleted';
    
    // Act
    setInCache(key, value);
    deleteFromCache(key);
    
    // Assert
    expect(getFromCache(key)).toBeUndefined();
  });

  test('should use namespaces correctly', () => {
    // Arrange
    const key = 'shared-key';
    const value1 = 'value in namespace 1';
    const value2 = 'value in namespace 2';
    
    // Act
    setInCache(key, value1, undefined, 'ns1');
    setInCache(key, value2, undefined, 'ns2');
    
    // Assert - each namespace has its own copy
    expect(getFromCache(key, 'ns1')).toEqual(value1);
    expect(getFromCache(key, 'ns2')).toEqual(value2);
    
    // Deleting from one namespace doesn't affect the other
    deleteFromCache(key, 'ns1');
    expect(getFromCache(key, 'ns1')).toBeUndefined();
    expect(getFromCache(key, 'ns2')).toEqual(value2);
  });

  test('should provide valid cache statistics', () => {
    // Arrange
    setInCache('stats-test-1', 'value1');
    setInCache('stats-test-2', 'value2');
    setInCache('stats-test-3', 'value3', 100);
    
    // Act
    const stats = getCacheStats();
    
    // Assert
    expect(stats).toHaveProperty('totalItems');
    expect(stats.totalItems).toBe(3);
    expect(stats).toHaveProperty('namespaces');
    expect(stats).toHaveProperty('memoryUsageEstimate');
    expect(stats.memoryUsageEstimate).toBeGreaterThan(0);
  });

  test('should clear all cache contents', () => {
    // Arrange
    setInCache('clear-test-1', 'value1');
    setInCache('clear-test-2', 'value2', undefined, 'custom-ns');
    
    // Act
    clearCache();
    
    // Assert
    expect(getFromCache('clear-test-1')).toBeUndefined();
    expect(getFromCache('clear-test-2', 'custom-ns')).toBeUndefined();
    expect(getCacheStats().totalItems).toBe(0);
  });
});