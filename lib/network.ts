import { supabase } from '@/lib/supabase';

// Network status check
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Retry wrapper for China mainland network adaptation
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Connection state manager
export class ConnectionManager {
  private static instance: ConnectionManager;
  private isConnected: boolean = true;
  private listeners: ((connected: boolean) => void)[] = [];

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async checkConnection(): Promise<boolean> {
    this.isConnected = await checkNetworkStatus();
    this.notifyListeners();
    return this.isConnected;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  subscribe(callback: (connected: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.isConnected));
  }
}

// Error messages in Chinese
export const ERROR_MESSAGES: Record<string, string> = {
  network_error: '网络连接失败，请检查网络后重试',
  timeout: '请求超时，请稍后重试',
  unauthorized: '登录已过期，请重新登录',
  unknown: '发生未知错误，请稍后重试',
  user_not_found: '用户不存在',
  friend_exists: '已经是好友了',
  group_full: '群成员已满',
  no_permission: '没有权限执行此操作',
};
