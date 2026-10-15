export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  avatarInitials: string;
  focusArea: string;
  createdAt: string;
  token?: string;
  isDemo?: boolean;
  dailyTargetMinutes?: number;
}
