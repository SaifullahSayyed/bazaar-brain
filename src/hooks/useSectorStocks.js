import { useState, useCallback } from 'react';

export function useSectorStocks() {
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSectorId, setLastSectorId] = useState(null);

  const fetchStocks = useCallback(async (sectorId) => {
    if (sectorId === lastSectorId && stocks.length > 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`http://localhost:8080/api/sector/${sectorId}/stocks`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStocks(data.stocks || []);
      setLastSectorId(sectorId);
    } catch (err) {
      setError('Could not load stock data');
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [lastSectorId, stocks.length]);

  const clearStocks = useCallback(() => {
    setStocks([]);
    setLastSectorId(null);
  }, []);

  return { 
    stocks, isLoading, error, 
    fetchStocks, clearStocks 
  };
}
