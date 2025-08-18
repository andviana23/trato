/**
 * Hook para gerenciar conexões WebSocket
 * 
 * Este hook fornece funcionalidade para conectar, desconectar e
 * gerenciar mensagens de WebSocket de forma reativa.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: string | null;
  lastMessageData: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastMessageData, setLastMessageData] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  // Função para conectar
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Já conectado
    }

    if (isConnecting) {
      return; // Já tentando conectar
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Criar nova conexão WebSocket
      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      // Event listeners
      ws.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        setError(null);
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.(event);

        // Tentar reconectar se não foi fechado manualmente
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError('Erro na conexão WebSocket');
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const messageData: WebSocketMessage = {
            type: 'message',
            data: event.data,
            timestamp: Date.now(),
          };

          // Tentar fazer parse se for JSON
          if (typeof event.data === 'string') {
            try {
              const parsed = JSON.parse(event.data);
              messageData.type = parsed.type || 'message';
              messageData.data = parsed.data || parsed;
            } catch {
              // Se não for JSON válido, usar como string
              messageData.data = event.data;
            }
          }

          setLastMessage(event.data);
          setLastMessageData(messageData);
          onMessage?.(messageData);
        } catch (err) {
          console.error('Erro ao processar mensagem WebSocket:', err);
          setError('Erro ao processar mensagem');
        }
      };
    } catch (err) {
      setIsConnecting(false);
      setError('Erro ao criar conexão WebSocket');
      console.error('Erro ao criar WebSocket:', err);
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage, isConnecting]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  // Função para reconectar
  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Função para enviar mensagem
  const sendMessage = useCallback((message: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket não está conectado');
      return;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      setError(null);
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem WebSocket:', err);
    }
  }, []);

  // Conectar automaticamente quando o hook for montado
  useEffect(() => {
    connect();

    // Cleanup ao desmontar
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconectar quando a URL mudar
  useEffect(() => {
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [url]);

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    lastMessageData,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    error,
  };
}

/**
 * Hook especializado para analytics em tempo real
 */
export function useAnalyticsWebSocket(unidadeId?: string) {
  const url = unidadeId ? `/api/analytics/ws?unidade=${unidadeId}` : '/api/analytics/ws';
  
  const onMessage = useCallback((message: WebSocketMessage) => {
    // Processar mensagens específicas de analytics
    switch (message.type) {
      case 'appointment_update':
        console.log('Atualização de agendamento:', message.data);
        break;
      case 'revenue_update':
        console.log('Atualização de receita:', message.data);
        break;
      case 'queue_update':
        console.log('Atualização da fila:', message.data);
        break;
      case 'occupancy_update':
        console.log('Atualização de ocupação:', message.data);
        break;
      case 'performance_update':
        console.log('Atualização de performance:', message.data);
        break;
      default:
        console.log('Mensagem WebSocket:', message);
    }
  }, []);

  return useWebSocket({
    url,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    onMessage,
  });
}

/**
 * Hook especializado para fila em tempo real
 */
export function useQueueWebSocket(unidadeId?: string) {
  const url = unidadeId ? `/api/queue/ws?unidade=${unidadeId}` : '/api/queue/ws';
  
  const onMessage = useCallback((message: WebSocketMessage) => {
    // Processar mensagens específicas da fila
    switch (message.type) {
      case 'client_added':
        console.log('Cliente adicionado à fila:', message.data);
        break;
      case 'client_attended':
        console.log('Cliente atendido:', message.data);
        break;
      case 'client_removed':
        console.log('Cliente removido da fila:', message.data);
        break;
      case 'position_updated':
        console.log('Posição atualizada:', message.data);
        break;
      default:
        console.log('Mensagem da fila:', message);
    }
  }, []);

  return useWebSocket({
    url,
    reconnectInterval: 3000,
    maxReconnectAttempts: 15,
    onMessage,
  });
}
