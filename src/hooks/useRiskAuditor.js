import { useState, useCallback } from 'react'
import RiskProofEngine from '../logic/RiskAuditor'

export function useRiskAuditor() {
  const [auditResult, setAuditResult] = useState(null)
  const [solveTimeMs, setSolveTimeMs] = useState(0)
  const [isAuditing, setIsAuditing] = useState(false)

  const auditSectors = useCallback((sectors) => {
    if (!sectors?.length) return null
    setIsAuditing(true)
    const result = RiskProofEngine.audit(sectors)
    setAuditResult(result)
    setSolveTimeMs(parseFloat(result.solveTimeMs.toFixed(3)))
    setIsAuditing(false)
    return result
  }, [])

  return { 
    auditResult, 
    solveTimeMs, 
    isAuditing, 
    auditSectors 
  }
}
