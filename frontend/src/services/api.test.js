import api from './api';

describe('API Service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('makes GET request correctly', async () => {
    const mockData = { data: 'test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await api.get('/test-endpoint');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  test('makes POST request with data', async () => {
    const postData = { name: 'Test' };
    const mockResponse = { success: true };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.post('/test-endpoint', postData);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('handles errors correctly', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(api.get('/test-endpoint')).rejects.toThrow('Network error');
  });
});
