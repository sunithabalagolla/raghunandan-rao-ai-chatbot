import User, { IUserDocument } from '../shared/models/User.model';
import { CreateUserData } from '../shared/types/user.types';

/**
 * User Repository
 * Handles all database operations for users
 */

/**
 * Create a new user
 * @param userData - User data to create
 * @returns Created user document
 */
export const createUser = async (userData: CreateUserData): Promise<IUserDocument> => {
  try {
    const user = await User.create(userData);
    console.log(`✅ User created: ${user.email}`);
    return user;
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === 11000) {
      throw new Error('Email already exists');
    }
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

/**
 * Find user by email
 * @param email - User's email address
 * @returns User document or null if not found
 */
export const findByEmail = async (email: string): Promise<IUserDocument | null> => {
  try {
    // Convert email to lowercase for case-insensitive search
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Find user by ID
 * @param userId - User's ID
 * @returns User document or null if not found
 */
export const findById = async (userId: string): Promise<IUserDocument | null> => {
  try {
    const user = await User.findById(userId).select('+passwordHash');
    return user;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Find user by Google ID
 * @param googleId - User's Google ID
 * @returns User document or null if not found
 */
export const findByGoogleId = async (googleId: string): Promise<IUserDocument | null> => {
  try {
    const user = await User.findOne({ googleId });
    return user;
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Update user's password
 * @param userId - User's ID
 * @param passwordHash - New hashed password
 * @returns Updated user document
 */
export const updatePassword = async (
  userId: string,
  passwordHash: string
): Promise<IUserDocument | null> => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { passwordHash },
      { new: true } // Return updated document
    );

    if (user) {
      console.log(`✅ Password updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error('Failed to update password');
  }
};

/**
 * Update user's last login timestamp
 * @param userId - User's ID
 * @returns Updated user document
 */
export const updateLastLogin = async (userId: string): Promise<IUserDocument | null> => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date() },
      { new: true }
    );

    if (user) {
      console.log(`✅ Last login updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new Error('Failed to update last login');
  }
};

/**
 * Update user profile information
 * @param userId - User's ID
 * @param updates - Fields to update (firstName, lastName, phoneNumber)
 * @returns Updated user document
 */
export const updateProfile = async (
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }
): Promise<IUserDocument | null> => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true } // Run model validators
    );

    if (user) {
      console.log(`✅ Profile updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }
};

/**
 * Delete user by ID
 * @param userId - User's ID
 * @returns True if deleted, false if not found
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const result = await User.findByIdAndDelete(userId);

    if (result) {
      console.log(`✅ User deleted: ${result.email}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

/**
 * Check if email exists
 * @param email - Email to check
 * @returns True if email exists, false otherwise
 */
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Failed to check email');
  }
};

/**
 * Get all users (for admin)
 * @param limit - Maximum number of users to return
 * @param skip - Number of users to skip (for pagination)
 * @returns Array of user documents
 */
export const getAllUsers = async (
  limit: number = 50,
  skip: number = 0
): Promise<IUserDocument[]> => {
  try {
    const users = await User.find()
      .select('-passwordHash') // Don't include password
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }); // Newest first

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
};

/**
 * Get total user count (for admin)
 * @returns Total number of users
 */
export const getUserCount = async (): Promise<number> => {
  try {
    const count = await User.countDocuments();
    return count;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Failed to get user count');
  }
};

/**
 * Search users by email or name (for admin)
 * @param searchTerm - Search term
 * @param limit - Maximum number of results
 * @returns Array of matching user documents
 */
export const searchUsers = async (
  searchTerm: string,
  limit: number = 20
): Promise<IUserDocument[]> => {
  try {
    const users = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .select('-passwordHash')
      .limit(limit)
      .sort({ createdAt: -1 });

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
};

/**
 * Find user by Facebook ID
 * @param facebookId - User's Facebook ID
 * @returns User document or null if not found
 */
export const findByFacebookId = async (facebookId: string): Promise<IUserDocument | null> => {
  try {
    const user = await User.findOne({ facebookId });
    return user;
  } catch (error) {
    console.error('Error finding user by Facebook ID:', error);
    throw new Error('Failed to find user');
  }
};
