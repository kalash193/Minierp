export interface RecentActivity {
  id: string;
  description: string;
  timestamp: Date;
  user: string;
  type: 'auth' | 'product' | 'order' | 'user';
}
