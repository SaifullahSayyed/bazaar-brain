import { useCallback } from 'react'
import RiskProofEngine from '../logic/RiskAuditor'
import { useMarketStore } from '../context/MarketStore'

export function useRiskAuditor() {
  const auditSectors = useCallback((sectors) => {
    if (!sectors?.length) return null
    
    const result = RiskProofEngine.audit(sectors)
    
    // Update the global store directly
    useMarketStore.getState().setAuditResult(result)
    
    return result
  }, [])

  return { 
    auditSectors 
  }
}
