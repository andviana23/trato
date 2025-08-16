import dayjs from 'dayjs';

/**
 * Obtém a altura do slot em pixels, seja da prop ou da CSS var
 */
export function getSlotHeightPx(slotHeightPx?: number, slotMinutes: number = 10): number {
  if (slotHeightPx) return slotHeightPx;
  
  // Ler da CSS var --slot-10m
  const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--slot-10m');
  if (cssValue) {
    const parsed = parseInt(cssValue.replace('px', '').trim());
    if (!isNaN(parsed)) return parsed;
  }
  
  // Default fallback para 31px (10 minutos)
  return 31;
}

/**
 * Verifica se há conflito de horário para o mesmo resource
 */
export function hasConflict(
  events: Array<{ id: string; resourceId?: string | number; start: string; end: string }>,
  resourceId: string | number | undefined,
  startISO: string,
  endISO: string,
  ignoreId?: string
): { hasConflict: boolean; conflictingEvent?: typeof events[0] } {
  const newStart = dayjs(startISO);
  const newEnd = dayjs(endISO);
  
  const conflictingEvent = events.find(event => {
    // Ignorar o próprio evento se especificado
    if (ignoreId && event.id === ignoreId) return false;
    
    // Verificar mesmo resource (ou dia para week view)
    if (resourceId !== undefined && String(event.resourceId) !== String(resourceId)) return false;
    
    const existStart = dayjs(event.start);
    const existEnd = dayjs(event.end);
    
    // Verificar overlap: newStart < existEnd && newEnd > existStart
    return newStart.isBefore(existEnd) && newEnd.isAfter(existStart);
  });
  
  return {
    hasConflict: !!conflictingEvent,
    conflictingEvent
  };
}

/**
 * Encontra o próximo slot livre disponível
 */
export function nextFreeSlot(
  events: Array<{ id: string; resourceId?: string | number; start: string; end: string }>,
  resourceId: string | number | undefined,
  startISO: string,
  endISO: string,
  slotMinutes: number,
  maxSearchHours: number = 8
): { found: boolean; startISO?: string; endISO?: string } {
  let testStart = dayjs(startISO);
  const duration = dayjs(endISO).diff(testStart, 'minute');
  const maxTime = testStart.add(maxSearchHours, 'hour');
  
  while (testStart.isBefore(maxTime)) {
    const testEnd = testStart.add(duration, 'minute');
    const conflict = hasConflict(events, resourceId, testStart.toISOString(), testEnd.toISOString());
    
    if (!conflict.hasConflict) {
      return {
        found: true,
        startISO: testStart.toISOString(),
        endISO: testEnd.toISOString()
      };
    }
    
    // Avançar para o próximo slot
    testStart = testStart.add(slotMinutes, 'minute');
  }
  
  return { found: false };
}
