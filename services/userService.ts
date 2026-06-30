import { User, BlockedIP } from '../types';
import {
  fetchUsersFromBackend,
  fetchUserByEmailFromBackend,
  createUserInBackend,
  updateUserInBackend,
  deleteUserFromBackend,
  verifyUserPasswordInBackend,
  fetchBlockedIPsFromBackend,
  blockIPInBackend,
  unblockIPInBackend,
  isIPBlockedInBackend,
} from './backendApiService';

export const fetchUsersFromSupabase = async (): Promise<User[]> => {
  return fetchUsersFromBackend();
};
export const fetchUserByEmail = async (email: string): Promise<User | null> => {
  return fetchUserByEmailFromBackend(email);
};
export const createUserInSupabase = async (user: User, passwordHash?: string): Promise<User | null> => {
  return createUserInBackend(user, passwordHash);
};
export const updateUserInSupabase = async (user: User): Promise<boolean> => {
  return updateUserInBackend(user);
};
export const deleteUserFromSupabase = async (userId: string): Promise<boolean> => {
  return deleteUserFromBackend(userId);
};
export const verifyUserPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    return verifyUserPasswordInBackend(email, password);
  } catch (err) {
    console.error('Error in verifyUserPassword:', err);
    return false;
  }
};

export const fetchBlockedIPsFromSupabase = async (): Promise<BlockedIP[]> => {
  try {
    const ips = await fetchBlockedIPsFromBackend();
    return ips.map(row => ({
      ip: row.ip_address,
      blockedAt: row.blocked_at,
      reason: row.reason || 'No reason provided'
    }));
  } catch (err) {
    console.error('Error in fetchBlockedIPsFromSupabase:', err);
    return [];
  }
};
export const blockIPInSupabase = async (ip: string, reason: string): Promise<boolean> => {
  return blockIPInBackend(ip, reason);
};
export const unblockIPInSupabase = async (ip: string): Promise<boolean> => {
  return unblockIPInBackend(ip);
};
export const isIPBlocked = async (ip: string): Promise<boolean> => {
  return isIPBlockedInBackend(ip);
};
